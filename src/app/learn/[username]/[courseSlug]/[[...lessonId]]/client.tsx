'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle,
  Circle,
  Play,
  Video,
  FileText,
  File,
  Download,
  Clock,
  Menu,
  X,
  ArrowLeft,
  BookOpen,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface CourseData {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
}

interface SectionData {
  id: string;
  title: string;
  position: number;
}

interface LessonData {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  type: 'video' | 'text' | 'file';
  position: number;
  video_url: string | null;
  video_duration_seconds: number | null;
  content: string | null;
  file_url: string | null;
  is_free_preview: boolean;
  estimated_duration_minutes: number | null;
}

interface ProgressData {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  watch_position_seconds: number;
  completed_at: string | null;
}

interface EnrollmentData {
  id: string;
  course_id: string;
}

const LESSON_TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  text: FileText,
  file: File,
};

export function CoursePlayerClient({
  course,
  sections,
  lessons,
  currentLesson,
  progress,
  enrollment,
  creator,
}: {
  course: CourseData;
  sections: SectionData[];
  lessons: LessonData[];
  currentLesson: LessonData;
  progress: ProgressData[];
  enrollment: EnrollmentData;
  creator: { username: string; full_name: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localProgress, setLocalProgress] = useState<Map<string, ProgressData>>(
    new Map(progress.map(p => [p.lesson_id, p]))
  );
  const [isCompleted, setIsCompleted] = useState(
    localProgress.get(currentLesson.id)?.is_completed || false
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const progressSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Calculate overall progress
  const completedCount = Array.from(localProgress.values()).filter(p => p.is_completed).length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isFullyCompleted = completedCount === totalLessons;

  // Find current lesson index and neighbors
  const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Save progress to DB
  const saveProgress = useCallback(async (lessonId: string, data: { is_completed?: boolean; watch_position_seconds?: number }) => {
    const existing = localProgress.get(lessonId);

    if (existing) {
      await (supabase.from('lesson_progress') as any)
        .update({
          ...data,
          completed_at: data.is_completed ? new Date().toISOString() : existing.completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      setLocalProgress(prev => {
        const next = new Map(prev);
        next.set(lessonId, { ...existing, ...data } as ProgressData);
        return next;
      });
    } else {
      const { data: newProgress } = await (supabase.from('lesson_progress') as any)
        .insert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          student_user_id: null, // will be set by RLS or trigger
          is_completed: data.is_completed || false,
          watch_position_seconds: data.watch_position_seconds || 0,
          completed_at: data.is_completed ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (newProgress) {
        setLocalProgress(prev => {
          const next = new Map(prev);
          next.set(lessonId, newProgress);
          return next;
        });
      }
    }
  }, [localProgress, enrollment.id, supabase]);

  // Toggle lesson completion
  const toggleComplete = async () => {
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    await saveProgress(currentLesson.id, { is_completed: newCompleted });

    if (newCompleted) {
      // Check if course is now fully completed
      const newCompletedCount = completedCount + 1;
      if (newCompletedCount === totalLessons) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
    }
  };

  // Video time tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentLesson.type !== 'video') return;

    // Restore position
    const existingProgress = localProgress.get(currentLesson.id);
    if (existingProgress?.watch_position_seconds && !existingProgress.is_completed) {
      video.currentTime = existingProgress.watch_position_seconds;
    }

    const handleTimeUpdate = () => {
      if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
      progressSaveTimer.current = setTimeout(() => {
        saveProgress(currentLesson.id, {
          watch_position_seconds: Math.round(video.currentTime),
        });
      }, 10000); // Save every 10 seconds of play
    };

    const handleEnded = async () => {
      setIsCompleted(true);
      await saveProgress(currentLesson.id, { is_completed: true, watch_position_seconds: Math.round(video.duration) });

      // Auto-advance after 2 seconds
      if (nextLesson) {
        setTimeout(() => {
          router.push(`/learn/${creator.username}/${course.slug}/${nextLesson.id}`);
        }, 2000);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    };
  }, [currentLesson.id, currentLesson.type, nextLesson, course.slug, creator.username, localProgress, saveProgress, router]);

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update completion state when switching lessons
  useEffect(() => {
    setIsCompleted(localProgress.get(currentLesson.id)?.is_completed || false);
  }, [currentLesson.id, localProgress]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0`}>
        {/* Course Header */}
        <div className="p-4 border-b border-gray-700">
          <Link
            href={`/courses/${creator.username}/${course.slug}`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to course
          </Link>
          <h2 className="font-semibold text-sm text-white truncate">{course.title}</h2>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{completedCount}/{totalLessons} complete</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Curriculum */}
        <div className="flex-1 overflow-y-auto">
          {sections
            .sort((a, b) => a.position - b.position)
            .map((section) => {
              const sectionLessons = lessons
                .filter(l => l.section_id === section.id)
                .sort((a, b) => a.position - b.position);

              return (
                <div key={section.id}>
                  <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 bg-gray-800/50">
                    {section.title}
                  </div>
                  {sectionLessons.map((lesson) => {
                    const isActive = lesson.id === currentLesson.id;
                    const isLessonCompleted = localProgress.get(lesson.id)?.is_completed || false;
                    const LessonIcon = LESSON_TYPE_ICONS[lesson.type] || FileText;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${creator.username}/${course.slug}/${lesson.id}`}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 ${
                          isActive
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'border-transparent hover:bg-gray-700/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        {isLessonCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        )}
                        <LessonIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
                        <span className="truncate flex-1">{lesson.title}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-gray-800 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-white truncate">{course.title}</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{completedCount}/{totalLessons} complete</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sections
                .sort((a, b) => a.position - b.position)
                .map((section) => {
                  const sectionLessons = lessons
                    .filter(l => l.section_id === section.id)
                    .sort((a, b) => a.position - b.position);

                  return (
                    <div key={section.id}>
                      <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                        {section.title}
                      </div>
                      {sectionLessons.map((lesson) => {
                        const isActive = lesson.id === currentLesson.id;
                        const isLessonCompleted = localProgress.get(lesson.id)?.is_completed || false;
                        const LessonIcon = LESSON_TYPE_ICONS[lesson.type] || FileText;

                        return (
                          <Link
                            key={lesson.id}
                            href={`/learn/${creator.username}/${course.slug}/${lesson.id}`}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              isActive
                                ? 'bg-indigo-600/20 text-white'
                                : 'hover:bg-gray-700/50 text-gray-400'
                            }`}
                          >
                            {isLessonCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            )}
                            <LessonIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
                            <span className="truncate flex-1">{lesson.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-medium text-white truncate max-w-[300px] md:max-w-none">
              {currentLesson.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Playback Speed (video only) */}
            {currentLesson.type === 'video' && (
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            )}

            {/* Complete Button */}
            <button
              onClick={toggleComplete}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isCompleted
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Video Lesson */}
          {currentLesson.type === 'video' && currentLesson.video_url && (
            <div className="bg-black">
              <div className="mx-auto max-w-5xl">
                <video
                  ref={videoRef}
                  src={currentLesson.video_url}
                  controls
                  className="w-full aspect-video"
                  autoPlay
                />
              </div>
            </div>
          )}

          {currentLesson.type === 'video' && !currentLesson.video_url && (
            <div className="flex items-center justify-center bg-gray-800 aspect-video max-w-5xl mx-auto">
              <div className="text-center text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p>Video not yet uploaded</p>
              </div>
            </div>
          )}

          {/* Text Lesson */}
          {currentLesson.type === 'text' && (
            <div className="mx-auto max-w-3xl px-4 py-8">
              <div
                className="prose prose-invert prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>This lesson has no content yet.</p>' }}
              />
            </div>
          )}

          {/* File Lesson */}
          {currentLesson.type === 'file' && (
            <div className="mx-auto max-w-3xl px-4 py-8">
              {currentLesson.file_url ? (
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-8 text-center">
                  <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Download Resource</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    {currentLesson.file_url.split('/').pop()}
                  </p>
                  <a
                    href={currentLesson.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <File className="w-12 h-12 mx-auto mb-2" />
                  <p>File not yet uploaded</p>
                </div>
              )}

              {currentLesson.content && (
                <div
                  className="prose prose-invert max-w-none mt-8"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />
              )}
            </div>
          )}

          {/* Lesson notes for video */}
          {currentLesson.type === 'video' && currentLesson.content && (
            <div className="mx-auto max-w-3xl px-4 py-8">
              <h3 className="text-lg font-medium text-white mb-4">Lesson Notes</h3>
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentLesson.content }}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800">
          {prevLesson ? (
            <Link
              href={`/learn/${creator.username}/${course.slug}/${prevLesson.id}`}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline truncate max-w-[200px]">{prevLesson.title}</span>
              <span className="sm:hidden">Previous</span>
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link
              href={`/learn/${creator.username}/${course.slug}/${nextLesson.id}`}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span className="hidden sm:inline truncate max-w-[200px]">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : isFullyCompleted ? (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Award className="w-4 h-4" />
              Course Complete!
            </div>
          ) : (
            <div />
          )}
        </div>
      </main>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center animate-fade-in">
            <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
            <p className="text-gray-300 mb-6">You&apos;ve completed the entire course!</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/dashboard/my-courses">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Back to My Courses
                </Button>
              </Link>
              <button
                onClick={() => setShowCelebration(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
