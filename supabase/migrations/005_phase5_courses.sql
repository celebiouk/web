-- Phase 5: Courses System
-- Multi-module video courses for Pro creators

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_image_url TEXT,
  promo_video_url TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('business', 'marketing', 'health', 'tech', 'creative', 'lifestyle', 'other')),
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, slug)
);

CREATE INDEX idx_courses_creator ON public.courses(creator_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_status ON public.courses(status);

-- ============================================
-- COURSE SECTIONS TABLE
-- ============================================
CREATE TABLE public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_sections_course ON public.course_sections(course_id);

-- ============================================
-- COURSE LESSONS TABLE
-- ============================================
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'text', 'file')),
  position INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  video_duration_seconds INTEGER,
  content TEXT, -- Rich text content for text lessons
  file_url TEXT,
  is_free_preview BOOLEAN DEFAULT false,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_lessons_section ON public.course_lessons(section_id);
CREATE INDEX idx_course_lessons_course ON public.course_lessons(course_id);

-- ============================================
-- LESSON ATTACHMENTS TABLE
-- ============================================
CREATE TABLE public.lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lesson_attachments_lesson ON public.lesson_attachments(lesson_id);

-- ============================================
-- ENROLLMENTS TABLE
-- ============================================
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  student_email TEXT NOT NULL,
  student_user_id UUID REFERENCES public.profiles(id),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  platform_fee_cents INTEGER DEFAULT 0,
  net_amount_cents INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT UNIQUE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_email)
);

CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_user_id);
CREATE INDEX idx_enrollments_email ON public.enrollments(student_email);
CREATE INDEX idx_enrollments_creator ON public.enrollments(creator_id);

-- ============================================
-- LESSON PROGRESS TABLE
-- ============================================
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES public.profiles(id),
  is_completed BOOLEAN DEFAULT false,
  watch_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON public.course_lessons;
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Creators can manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can read published courses" ON public.courses;
DROP POLICY IF EXISTS "Creators can manage own sections" ON public.course_sections;
DROP POLICY IF EXISTS "Anyone can read sections of published courses" ON public.course_sections;
DROP POLICY IF EXISTS "Creators can manage own lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Anyone can read free preview lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Enrolled students can read lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Creators can manage own attachments" ON public.lesson_attachments;
DROP POLICY IF EXISTS "Enrolled students can read attachments" ON public.lesson_attachments;
DROP POLICY IF EXISTS "Creators can read enrollments for their courses" ON public.enrollments;
DROP POLICY IF EXISTS "Students can read own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Service role can insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can manage own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Creators can read progress for their courses" ON public.lesson_progress;

-- COURSES: Creators manage own, anyone reads published
CREATE POLICY "Creators can manage own courses"
  ON public.courses FOR ALL
  USING (creator_id = auth.uid());

CREATE POLICY "Anyone can read published courses"
  ON public.courses FOR SELECT
  USING (status = 'published');

-- SECTIONS: Creators manage own, anyone reads if course published
CREATE POLICY "Creators can manage own sections"
  ON public.course_sections FOR ALL
  USING (course_id IN (SELECT id FROM public.courses WHERE creator_id = auth.uid()));

CREATE POLICY "Anyone can read sections of published courses"
  ON public.course_sections FOR SELECT
  USING (course_id IN (SELECT id FROM public.courses WHERE status = 'published'));

-- LESSONS: Creators manage own, read if enrolled or free preview
CREATE POLICY "Creators can manage own lessons"
  ON public.course_lessons FOR ALL
  USING (course_id IN (SELECT id FROM public.courses WHERE creator_id = auth.uid()));

CREATE POLICY "Anyone can read free preview lessons"
  ON public.course_lessons FOR SELECT
  USING (
    is_free_preview = true
    AND course_id IN (SELECT id FROM public.courses WHERE status = 'published')
  );

CREATE POLICY "Enrolled students can read lessons"
  ON public.course_lessons FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM public.enrollments
      WHERE student_user_id = auth.uid()
    )
  );

-- ATTACHMENTS: Creators manage own, enrolled students read
CREATE POLICY "Creators can manage own attachments"
  ON public.lesson_attachments FOR ALL
  USING (
    lesson_id IN (
      SELECT cl.id FROM public.course_lessons cl
      JOIN public.courses c ON c.id = cl.course_id
      WHERE c.creator_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled students can read attachments"
  ON public.lesson_attachments FOR SELECT
  USING (
    lesson_id IN (
      SELECT cl.id FROM public.course_lessons cl
      WHERE cl.course_id IN (
        SELECT course_id FROM public.enrollments
        WHERE student_user_id = auth.uid()
      )
    )
  );

-- ENROLLMENTS: Creator reads own course enrollments, students read own
CREATE POLICY "Creators can read enrollments for their courses"
  ON public.enrollments FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Students can read own enrollments"
  ON public.enrollments FOR SELECT
  USING (student_user_id = auth.uid());

CREATE POLICY "Service role can insert enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (true);

-- LESSON PROGRESS: Students manage own
CREATE POLICY "Students can manage own progress"
  ON public.lesson_progress FOR ALL
  USING (student_user_id = auth.uid());

CREATE POLICY "Creators can read progress for their courses"
  ON public.lesson_progress FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM public.enrollments
      WHERE creator_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Run these in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('course-covers', 'course-covers', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-files', 'lesson-files', false);

-- Storage policies for course-covers (public read, auth write)
-- CREATE POLICY "Anyone can read course covers" ON storage.objects FOR SELECT USING (bucket_id = 'course-covers');
-- CREATE POLICY "Auth users can upload course covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-covers' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete own course covers" ON storage.objects FOR DELETE USING (bucket_id = 'course-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for course-videos (private, signed URLs only)
-- CREATE POLICY "Auth users can upload course videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-videos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can manage own course videos" ON storage.objects FOR ALL USING (bucket_id = 'course-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for lesson-files (private, signed URLs only)
-- CREATE POLICY "Auth users can upload lesson files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lesson-files' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can manage own lesson files" ON storage.objects FOR ALL USING (bucket_id = 'lesson-files' AND auth.uid()::text = (storage.foldername(name))[1]);
