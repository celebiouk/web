'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Input, Textarea, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeft,
  Save,
  Video,
  FileText,
  File,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Paperclip,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
  Play,
} from 'lucide-react';

// Types
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

interface Attachment {
  id: string;
  lesson_id: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
}

// ==========================================
// Simple Rich Text Editor Component
// ==========================================
function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your lesson content...',
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = content || '';
      isInitialized.current = true;
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 flex-wrap">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="rounded px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="rounded px-2 py-1 text-sm italic text-gray-700 hover:bg-gray-200 transition-colors"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="rounded px-2 py-1 text-sm underline text-gray-700 hover:bg-gray-200 transition-colors"
          title="Underline"
        >
          U
        </button>
        <div className="mx-1 h-4 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'h2')}
          className="rounded px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'h3')}
          className="rounded px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
          title="Subheading"
        >
          H3
        </button>
        <div className="mx-1 h-4 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          title="Numbered List"
        >
          1. List
        </button>
        <div className="mx-1 h-4 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) execCommand('createLink', url);
          }}
          className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-gray-200 transition-colors"
          title="Insert Link"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'pre')}
          className="rounded px-2 py-1 text-xs font-mono text-gray-700 hover:bg-gray-200 transition-colors"
          title="Code Block"
        >
          {'</>'}
        </button>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[400px] p-4 text-gray-900 outline-none prose prose-sm max-w-none"
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}

// ==========================================
// Video Upload Component
// ==========================================
function VideoUploader({
  videoUrl,
  onUpload,
  onRemove,
  courseId,
  lessonId,
}: {
  videoUrl: string | null;
  onUpload: (url: string, duration: number | null) => void;
  onRemove: () => void;
  courseId: string;
  lessonId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload an MP4, WebM, MOV, or AVI file');
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be under 500MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const filePath = `${courseId}/${lessonId}/${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(data.path);

      setUploadProgress(100);

      // Try to detect video duration
      let duration: number | null = null;
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            duration = Math.round(video.duration);
            resolve();
          };
          video.onerror = () => resolve();
        });
      } catch {
        // Duration detection failed, that's ok
      }

      onUpload(urlData.publicUrl, duration);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (videoUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate flex-1">{videoUrl.split('/').pop()}</p>
          <button
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-700 ml-2"
          >
            Remove video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-gray-700">Uploading... {uploadProgress}%</p>
            <div className="mx-auto w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Video className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Click to upload video</p>
            <p className="text-xs text-gray-500">MP4, WebM, MOV up to 500MB</p>
          </div>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}

// ==========================================
// File Upload Component
// ==========================================
function FileUploader({
  fileUrl,
  onUpload,
  onRemove,
  courseId,
  lessonId,
}: {
  fileUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  courseId: string;
  lessonId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 100MB max
    if (file.size > 100 * 1024 * 1024) {
      setError('File must be under 100MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const filePath = `${courseId}/${lessonId}/${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lesson-files')
        .getPublicUrl(data.path);

      onUpload(urlData.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (fileUrl) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <File className="w-5 h-5 text-indigo-600" />
        </div>
        <p className="text-sm text-gray-700 truncate flex-1">{fileUrl.split('/').pop()}</p>
        <button
          onClick={onRemove}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors disabled:opacity-50"
      >
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <File className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {isUploading ? 'Uploading...' : 'Click to upload file'}
          </p>
          <p className="text-xs text-gray-500">Any file type, up to 100MB</p>
        </div>
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}

// ==========================================
// Attachments Component
// ==========================================
function AttachmentsSection({
  attachments,
  onAdd,
  onRemove,
  courseId,
  lessonId,
}: {
  attachments: Attachment[];
  onAdd: (attachment: Attachment) => void;
  onRemove: (id: string) => void;
  courseId: string;
  lessonId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const filePath = `attachments/${courseId}/${lessonId}/${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lesson-files')
        .getPublicUrl(data.path);

      // Save attachment to DB
      const { data: attachment, error: dbError } = await (supabase.from('lesson_attachments') as any)
        .insert({
          lesson_id: lessonId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size_bytes: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onAdd(attachment);
    } catch (err) {
      console.error('Attachment upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <Paperclip className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Add file'}
        </button>
      </div>
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">
                {attachment.file_name}
              </span>
              <span className="text-xs text-gray-400">
                {formatFileSize(attachment.file_size_bytes)}
              </span>
              <button
                onClick={async () => {
                  await (supabase.from('lesson_attachments') as any)
                    .delete()
                    .eq('id', attachment.id);
                  onRemove(attachment.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No attachments yet</p>
      )}
    </div>
  );
}

// ==========================================
// Main Lesson Editor Page
// ==========================================
export default function LessonEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const hasChanges = useRef(false);

  // Load lesson data
  useEffect(() => {
    async function loadLesson() {
      if (!user) return;

      try {
        const { data: lessonData, error: lessonError } = await (supabase.from('course_lessons') as any)
          .select('*')
          .eq('id', lessonId)
          .eq('course_id', courseId)
          .single();

        if (lessonError || !lessonData) {
          setError('Lesson not found');
          setIsLoading(false);
          return;
        }

        setLesson(lessonData);
        setTitle(lessonData.title);
        setContent(lessonData.content || '');
        setVideoUrl(lessonData.video_url);
        setVideoDuration(lessonData.video_duration_seconds);
        setFileUrl(lessonData.file_url);
        setIsFreePreview(lessonData.is_free_preview);
        setEstimatedDuration(lessonData.estimated_duration_minutes);

        // Load attachments
        const { data: attachmentData } = await (supabase.from('lesson_attachments') as any)
          .select('*')
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: true });

        setAttachments(attachmentData || []);
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError('Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    }

    loadLesson();
  }, [user, courseId, lessonId, supabase]);

  // Auto-save on content change
  const triggerAutoSave = useCallback(() => {
    hasChanges.current = true;
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      if (hasChanges.current) {
        handleSave(true);
      }
    }, 30000); // 30 second auto-save
  }, []);

  // Clean up auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // Save lesson
  const handleSave = async (isAutoSave = false) => {
    if (!lesson) return;

    if (!isAutoSave) setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Calculate estimated duration for text lessons
      let duration = estimatedDuration;
      if (lesson.type === 'text' && content) {
        // Roughly 200 words per minute reading speed
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
        duration = Math.max(1, Math.ceil(wordCount / 200));
      }

      const updateData: Record<string, unknown> = {
        title,
        content,
        video_url: videoUrl,
        video_duration_seconds: videoDuration,
        file_url: fileUrl,
        is_free_preview: isFreePreview,
        estimated_duration_minutes: lesson.type === 'video'
          ? (videoDuration ? Math.ceil(videoDuration / 60) : duration)
          : duration,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await (supabase.from('course_lessons') as any)
        .update(updateData)
        .eq('id', lessonId);

      if (updateError) throw updateError;

      hasChanges.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-gray-600">{error || 'Lesson not found'}</p>
          <Link href={`/dashboard/courses/${courseId}/edit`}>
            <Button variant="outline">Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  const LESSON_TYPE_CONFIG = {
    video: { icon: Video, label: 'Video Lesson', color: 'text-blue-600 bg-blue-100' },
    text: { icon: FileText, label: 'Text Article', color: 'text-green-600 bg-green-100' },
    file: { icon: File, label: 'File Resource', color: 'text-orange-600 bg-orange-100' },
  };

  const typeConfig = LESSON_TYPE_CONFIG[lesson.type];
  const TypeIcon = typeConfig.icon;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/courses/${courseId}/edit`}>
            <button className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-6 h-6 rounded flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm text-gray-500">{typeConfig.label}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Edit Lesson</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Error saving
            </span>
          )}

          <Button
            onClick={() => handleSave(false)}
            isLoading={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <Card>
          <CardContent className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Title
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutoSave();
              }}
              placeholder="Enter lesson title"
              className="text-lg font-medium"
            />
          </CardContent>
        </Card>

        {/* Free Preview Toggle */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isFreePreview ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Free Preview</p>
                  <p className="text-sm text-gray-500">
                    {isFreePreview
                      ? 'Anyone can view this lesson before enrolling'
                      : 'Only enrolled students can access this lesson'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsFreePreview(!isFreePreview);
                  triggerAutoSave();
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isFreePreview ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isFreePreview ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Content based on lesson type */}
        {lesson.type === 'video' && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Video</h2>
              <VideoUploader
                videoUrl={videoUrl}
                onUpload={(url, duration) => {
                  setVideoUrl(url);
                  setVideoDuration(duration);
                  triggerAutoSave();
                }}
                onRemove={() => {
                  setVideoUrl(null);
                  setVideoDuration(null);
                  triggerAutoSave();
                }}
                courseId={courseId}
                lessonId={lessonId}
              />
              {videoDuration && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  Duration: {formatDuration(videoDuration)}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Lesson Notes (optional)
                </h3>
                <RichTextEditor
                  content={content}
                  onChange={(html) => {
                    setContent(html);
                    triggerAutoSave();
                  }}
                  placeholder="Add notes, resources, or supplementary text for this video lesson..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {lesson.type === 'text' && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Lesson Content</h2>
                {content && (
                  <span className="text-sm text-gray-400">
                    ~{Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length / 200))} min read
                  </span>
                )}
              </div>
              <RichTextEditor
                content={content}
                onChange={(html) => {
                  setContent(html);
                  triggerAutoSave();
                }}
                placeholder="Write your lesson content here..."
              />
            </CardContent>
          </Card>
        )}

        {lesson.type === 'file' && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">File</h2>
              <FileUploader
                fileUrl={fileUrl}
                onUpload={(url) => {
                  setFileUrl(url);
                  triggerAutoSave();
                }}
                onRemove={() => {
                  setFileUrl(null);
                  triggerAutoSave();
                }}
                courseId={courseId}
                lessonId={lessonId}
              />

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </h3>
                <RichTextEditor
                  content={content}
                  onChange={(html) => {
                    setContent(html);
                    triggerAutoSave();
                  }}
                  placeholder="Describe this resource..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        <Card>
          <CardContent className="p-6">
            <AttachmentsSection
              attachments={attachments}
              onAdd={(attachment) => setAttachments(prev => [...prev, attachment])}
              onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
              courseId={courseId}
              lessonId={lessonId}
            />
          </CardContent>
        </Card>

        {/* Duration override (for video/file) */}
        {lesson.type !== 'text' && (
          <Card>
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <Input
                type="number"
                min="1"
                value={estimatedDuration || ''}
                onChange={(e) => {
                  setEstimatedDuration(e.target.value ? parseInt(e.target.value, 10) : null);
                  triggerAutoSave();
                }}
                placeholder={
                  lesson.type === 'video' && videoDuration
                    ? `Auto-detected: ${Math.ceil(videoDuration / 60)} min`
                    : 'Enter estimated duration'
                }
                className="max-w-[200px]"
              />
              <p className="mt-1 text-xs text-gray-400">
                {lesson.type === 'video'
                  ? 'Leave blank to auto-detect from video'
                  : 'How long should students spend on this resource?'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
