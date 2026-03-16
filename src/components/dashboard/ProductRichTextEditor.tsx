'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Button } from '@/components/ui';

interface ProductRichTextEditorProps {
  value: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
}

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px'];

export function ProductRichTextEditor({
  value,
  onChange,
  placeholder = 'Write your long-form sales copy. Add headings, bullets, links, images, and YouTube links.',
}: ProductRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML(), currentEditor.getText());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[260px] rounded-b-lg border border-t-0 border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white prose max-w-none dark:prose-invert',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const applyFontSize = (fontSize: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize }).run();
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL (including https://)');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt('Enter image URL');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertYouTubeLink = () => {
    const url = window.prompt('Paste YouTube URL');
    if (!url) return;
    editor.chain().focus().insertContent(`<p><a href="${url}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>`).run();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-900">
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBold().run()}>Bold</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullets</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbering</Button>
        <Button type="button" size="sm" variant="outline" onClick={insertLink}>Link</Button>
        <Button type="button" size="sm" variant="outline" onClick={insertImage}>Image URL</Button>
        <Button type="button" size="sm" variant="outline" onClick={insertYouTubeLink}>YouTube Link</Button>

        <label className="ml-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
          Color
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border border-gray-300 bg-transparent p-0 dark:border-gray-600"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#111827'}
          />
        </label>

        <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
          Size
          <select
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
            defaultValue="16px"
            onChange={(e) => applyFontSize(e.target.value)}
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <EditorContent editor={editor} />

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Tip: For videos, paste YouTube links. Direct video uploads are not supported.
      </p>
    </div>
  );
}
