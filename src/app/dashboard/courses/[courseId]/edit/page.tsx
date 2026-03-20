'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Button, Input, Textarea, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Eye,
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  File,
  Upload,
  X,
  Edit3,
  Check,
  Globe,
  Lock,
  Settings,
} from 'lucide-react';
import { isPayoutSetupComplete } from '@/lib/payout-routing';

// Types
interface Section {
  id: string;
  course_id: string;
  title: string;
  position: number;
  isCollapsed?: boolean;
}

interface Lesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  type: 'video' | 'text' | 'file';
  position: number;
  is_free_preview: boolean;
  video_duration_seconds: number | null;
  estimated_duration_minutes: number | null;
}

interface CourseDetails {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  promo_video_url: string | null;
  category: string;
  difficulty: string;
  price_cents: number;
  status: 'draft' | 'published';
  student_count: number;
}

const LESSON_TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  text: FileText,
  file: File,
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  video: 'Video Lesson',
  text: 'Text Article',
  file: 'File Resource',
};

// ==========================================
// Sortable Section Component
// ==========================================
function SortableSection({
  section,
  lessons,
  onRename,
  onDelete,
  onToggleCollapse,
  onAddLesson,
  onDeleteLesson,
  onTogglePreview,
  courseId,
}: {
  section: Section;
  lessons: Lesson[];
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddLesson: (sectionId: string, type: 'video' | 'text' | 'file') => void;
  onDeleteLesson: (lessonId: string) => void;
  onTogglePreview: (lessonId: string, current: boolean) => void;
  courseId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionLessons = lessons
    .filter(l => l.section_id === section.id)
    .sort((a, b) => a.position - b.position);

  function handleSaveTitle() {
    if (editTitle.trim()) {
      onRename(section.id, editTitle.trim());
    }
    setIsEditing(false);
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        {/* Section Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <button {...attributes} {...listeners} className="cursor-grab touch-none text-gray-400 hover:text-gray-600">
            <GripVertical className="h-4 w-4" />
          </button>
          <button onClick={() => onToggleCollapse(section.id)} className="text-gray-400 hover:text-gray-600">
            {section.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                className="h-8 text-sm"
                autoFocus
              />
              <button onClick={handleSaveTitle} className="text-emerald-500 hover:text-emerald-600">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setIsEditing(true); setEditTitle(section.title); }}
              className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-gray-900 hover:text-brand-600 dark:text-white"
            >
              {section.title}
              <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
            </button>
          )}
          <span className="text-xs text-gray-400">{sectionLessons.length} lessons</span>
          <button
            onClick={() => onDelete(section.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Lessons */}
        {!section.isCollapsed && (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {sectionLessons.map((lesson) => {
              const Icon = LESSON_TYPE_ICONS[lesson.type] || FileText;
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                  <Icon className="h-4 w-4 text-gray-400" />
                  <Link
                    href={`/dashboard/courses/${courseId}/lessons/${lesson.id}/edit`}
                    className="flex-1 text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-300"
                  >
                    {lesson.title}
                  </Link>
                  <button
                    onClick={() => onTogglePreview(lesson.id, lesson.is_free_preview)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                      lesson.is_free_preview
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                    title={lesson.is_free_preview ? 'Free preview (click to lock)' : 'Locked (click for free preview)'}
                  >
                    {lesson.is_free_preview ? (
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Preview</span>
                    ) : (
                      <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>
                    )}
                  </button>
                  {lesson.video_duration_seconds && (
                    <span className="text-xs text-gray-400">
                      {Math.ceil(lesson.video_duration_seconds / 60)}min
                    </span>
                  )}
                  {lesson.estimated_duration_minutes && lesson.type === 'text' && (
                    <span className="text-xs text-gray-400">
                      {lesson.estimated_duration_minutes}min read
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Add Lesson */}
            <div className="relative px-4 py-3">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>
              {showAddMenu && (
                <div className="absolute left-4 top-12 z-20 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {[
                    { type: 'video' as const, icon: Video, label: 'Video Lesson' },
                    { type: 'text' as const, icon: FileText, label: 'Text Article' },
                    { type: 'file' as const, icon: File, label: 'File Resource' },
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => {
                        onAddLesson(section.id, item.type);
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==========================================
// Main Course Editor Page
// ==========================================
export default function CourseEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'curriculum' | 'settings'>('curriculum');

  // Settings state
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('other');
  const [editDifficulty, setEditDifficulty] = useState('beginner');
  const [editPrice, setEditPrice] = useState('');
  const [editPromoUrl, setEditPromoUrl] = useState('');
  const [editCoverImage, setEditCoverImage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  async function loadCourse() {
    const supabase = createClient();

    // Load course
    const { data: courseData } = await (supabase.from('courses') as any)
      .select('*')
      .eq('id', courseId)
      .single();

    if (!courseData) {
      router.push('/dashboard/courses');
      return;
    }

    const typedCourse = courseData as CourseDetails;
    setCourse(typedCourse);
    setEditTitle(typedCourse.title);
    setEditSubtitle(typedCourse.subtitle || '');
    setEditDescription(typedCourse.description || '');
    setEditCategory(typedCourse.category);
    setEditDifficulty(typedCourse.difficulty);
    setEditPrice(typedCourse.price_cents > 0 ? (typedCourse.price_cents / 100).toFixed(2) : '');
    setEditPromoUrl(typedCourse.promo_video_url || '');
    setEditCoverImage(typedCourse.cover_image_url);

    // Load sections
    const { data: sectionsData } = await (supabase.from('course_sections') as any)
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    setSections((sectionsData as Section[]) || []);

    // Load lessons
    const { data: lessonsData } = await (supabase.from('course_lessons') as any)
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    setLessons((lessonsData as Lesson[]) || []);
    setLoading(false);
  }

  // === Curriculum Actions ===

  async function addSection() {
    const supabase = createClient();
    const position = sections.length;

    const { data } = await (supabase.from('course_sections') as any)
      .insert({
        course_id: courseId,
        title: `Section ${position + 1}`,
        position,
      })
      .select()
      .single();

    if (data) {
      setSections(prev => [...prev, data as Section]);
    }
  }

  async function renameSection(sectionId: string, title: string) {
    const supabase = createClient();
    await (supabase.from('course_sections') as any)
      .update({ title })
      .eq('id', sectionId);

    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s));
  }

  async function deleteSection(sectionId: string) {
    if (!confirm('Delete this section and all its lessons?')) return;

    const supabase = createClient();
    await (supabase.from('course_sections') as any)
      .delete()
      .eq('id', sectionId);

    setSections(prev => prev.filter(s => s.id !== sectionId));
    setLessons(prev => prev.filter(l => l.section_id !== sectionId));
  }

  function toggleCollapse(sectionId: string) {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, isCollapsed: !s.isCollapsed } : s
    ));
  }

  async function addLesson(sectionId: string, type: 'video' | 'text' | 'file') {
    const supabase = createClient();
    const sectionLessons = lessons.filter(l => l.section_id === sectionId);
    const position = sectionLessons.length;

    const { data } = await (supabase.from('course_lessons') as any)
      .insert({
        section_id: sectionId,
        course_id: courseId,
        title: `New ${LESSON_TYPE_LABELS[type]}`,
        type,
        position,
        is_free_preview: false,
      })
      .select()
      .single();

    if (data) {
      setLessons(prev => [...prev, data as Lesson]);
    }
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson?')) return;

    const supabase = createClient();
    await (supabase.from('course_lessons') as any)
      .delete()
      .eq('id', lessonId);

    setLessons(prev => prev.filter(l => l.id !== lessonId));
  }

  async function togglePreview(lessonId: string, current: boolean) {
    const supabase = createClient();
    await (supabase.from('course_lessons') as any)
      .update({ is_free_preview: !current })
      .eq('id', lessonId);

    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, is_free_preview: !current } : l
    ));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      position: i,
    }));
    setSections(newSections);

    // Persist positions
    const supabase = createClient();
    for (const section of newSections) {
      await (supabase.from('course_sections') as any)
        .update({ position: section.position })
        .eq('id', section.id);
    }
  }

  // === Settings Actions ===

  async function saveSettings() {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const supabase = createClient();
      const price = parseFloat(editPrice);
      const priceCents = editPrice && !isNaN(price) ? Math.round(price * 100) : 0;

      const { error: updateError } = await (supabase.from('courses') as any)
        .update({
          title: editTitle.trim(),
          subtitle: editSubtitle.trim() || null,
          description: editDescription.trim() || null,
          category: editCategory,
          difficulty: editDifficulty,
          price_cents: priceCents,
          promo_video_url: editPromoUrl.trim() || null,
          cover_image_url: editCoverImage,
        })
        .eq('id', courseId);

      if (updateError) throw updateError;

      setCourse(prev => prev ? {
        ...prev,
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || null,
        description: editDescription.trim() || null,
        category: editCategory,
        difficulty: editDifficulty,
        price_cents: priceCents,
        promo_video_url: editPromoUrl.trim() || null,
        cover_image_url: editCoverImage,
      } : null);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!course) return;

    const supabase = createClient();

    if (course.status === 'draft') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in again to continue.');
        return;
      }

      const { data: profile } = await (supabase.from('profiles') as any)
        .select('payout_country_code,payout_provider,stripe_account_id,stripe_account_status,paystack_subaccount_code,paystack_subaccount_status,manual_bank_account_name,manual_bank_account_number,manual_bank_name,manual_bank_code,manual_bank_iban,manual_bank_swift')
        .eq('id', user.id)
        .single();

      if (!isPayoutSetupComplete(profile)) {
        alert('Complete your payout settings before publishing. Go to Dashboard → Settings → Payments.');
        return;
      }
    }

    // Validate before publishing
    if (course.status === 'draft') {
      if (lessons.length === 0) {
        alert('Add at least one lesson before publishing.');
        return;
      }
    }

    const newStatus = course.status === 'draft' ? 'published' : 'draft';

    await (supabase.from('courses') as any)
      .update({ status: newStatus })
      .eq('id', courseId);

    setCourse(prev => prev ? { ...prev, status: newStatus } : null);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('course-covers')
      .upload(filePath, file, { upsert: true });

    if (error) {
      if (error.message.toLowerCase().includes('bucket')) {
        alert('Course storage is not set up yet. Please run the latest Supabase migrations and try again.');
      } else {
        alert(error.message);
      }
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-covers')
      .getPublicUrl(filePath);
    setEditCoverImage(publicUrl);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = lessons.length;
  const videoLessons = lessons.filter(l => l.type === 'video').length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/courses')}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={course.status === 'published' ? 'success' : 'default'}>
                {course.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
              <span className="text-xs text-gray-400">{totalLessons} lessons · {videoLessons} videos</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="text-sm text-emerald-500">Saved ✓</span>
          )}
          <Button variant="outline" onClick={togglePublish}>
            {course.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {[
          { key: 'curriculum' as const, label: 'Curriculum', icon: FileText },
          { key: 'settings' as const, label: 'Settings', icon: Settings },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Curriculum Tab */}
      {activeTab === 'curriculum' && (
        <div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  lessons={lessons}
                  onRename={renameSection}
                  onDelete={deleteSection}
                  onToggleCollapse={toggleCollapse}
                  onAddLesson={addLesson}
                  onDeleteLesson={deleteLesson}
                  onTogglePreview={togglePreview}
                  courseId={courseId}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button variant="outline" onClick={addSection} className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtitle</label>
                  <Input value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} placeholder="Short tagline" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={6} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {['business','marketing','health','tech','creative','lifestyle','other'].map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                    <select
                      value={editDifficulty}
                      onChange={e => setEditDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {['beginner','intermediate','advanced'].map(d => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input type="number" min="0" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="pl-8" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Promo Video URL</label>
                  <Input value={editPromoUrl} onChange={e => setEditPromoUrl(e.target.value)} placeholder="https://youtube.com/..." />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Cover Image */}
            <Card>
              <CardContent className="p-6">
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Image</label>
                {editCoverImage ? (
                  <div className="relative aspect-video overflow-hidden rounded-xl">
                    <Image src={editCoverImage} alt="Cover" fill className="object-cover" />
                    <button
                      onClick={() => setEditCoverImage(null)}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800">
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Upload cover</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Save */}
            <Button className="w-full" onClick={saveSettings} disabled={saving} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
