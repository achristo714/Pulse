import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { format } from 'date-fns';
import { StatusCircle } from './StatusCircle';
import { SubtaskList } from './SubtaskList';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useTaskStore } from '../../stores/taskStore';
import { CATEGORY_CONFIG, CATEGORIES, STATUSES } from '../../lib/constants';
import type { Task, Profile, TaskCategory } from '../../lib/types';
import { supabase } from '../../lib/supabase';

interface TaskDetailPanelProps {
  task: Task;
  members: Profile[];
  onClose: () => void;
}

export function TaskDetailPanel({ task, members, onClose }: TaskDetailPanelProps) {
  const { updateTask, deleteTask, cycleStatus, uploadImage, deleteImage } = useTaskStore();
  const [title, setTitle] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Add notes...' }),
    ],
    content: task.notes || '',
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== task.notes) {
        updateTask(task.id, { notes: html });
      }
    },
  });

  useEffect(() => {
    if (editor && task.notes !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== task.notes && task.notes !== null) {
        editor.commands.setContent(task.notes || '');
      }
    }
  }, [task.notes, editor]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
  };

  const handleImageUpload = useCallback(async (files: FileList) => {
    const maxImages = 10;
    const currentCount = task.images?.length || 0;
    const remaining = maxImages - currentCount;
    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      await uploadImage(task.id, file);
    }
  }, [task.id, task.images?.length, uploadImage]);

  const getImageUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('task-images').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const assignedMember = members.find((m) => m.id === task.assigned_to);

  return (
    <div className="fixed right-0 top-14 bottom-0 w-[400px] bg-bg-surface border-l border-border-default overflow-y-auto z-30 shadow-[-4px_0_24px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
        <span className="text-[11px] text-text-muted uppercase tracking-wider">Task Detail</span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors duration-150 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full bg-transparent text-[16px] font-semibold text-text-primary tracking-[-0.01em] focus:outline-none"
        />

        {/* Status */}
        <div>
          <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
            Status
          </label>
          <div className="flex gap-3">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateTask(task.id, { status: s })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all duration-150 cursor-pointer border ${
                  task.status === s
                    ? 'border-border-focus bg-bg-surface-active text-text-primary'
                    : 'border-border-default text-text-secondary hover:bg-bg-surface-hover'
                }`}
              >
                <StatusCircle status={s} size={14} />
                {s === 'todo' ? 'To Do' : s === 'wip' ? 'In Progress' : 'Done'}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
            Category
          </label>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => updateTask(task.id, { category: cat })}
                className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all duration-150 cursor-pointer border ${
                  task.category === cat
                    ? 'border-border-focus bg-bg-surface-active text-text-primary'
                    : 'border-border-default text-text-secondary hover:bg-bg-surface-hover'
                }`}
                style={task.category === cat ? { borderColor: CATEGORY_CONFIG[cat].color } : {}}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                />
                {CATEGORY_CONFIG[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
            Assigned To
          </label>
          <select
            value={task.assigned_to || ''}
            onChange={(e) => updateTask(task.id, { assigned_to: e.target.value || null })}
            className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-focus transition-colors duration-150"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={task.due_date || ''}
            onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })}
            className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-focus transition-colors duration-150 [color-scheme:dark]"
          />
        </div>

        {/* Subtasks */}
        <div className="border-t border-border-default pt-4">
          <SubtaskList taskId={task.id} subtasks={task.subtasks || []} />
        </div>

        {/* Notes */}
        <div className="border-t border-border-default pt-4">
          <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
            Notes
          </label>
          <div className="bg-bg-primary border border-border-default rounded-[4px] min-h-[100px]">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Images */}
        <div className="border-t border-border-default pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Images
            </label>
            <span className="text-[11px] text-text-muted">
              {task.images?.length || 0}/10
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {task.images?.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-[4px] overflow-hidden bg-bg-primary">
                <img
                  src={getImageUrl(img.storage_path)}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deleteImage(img.id, img.storage_path)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {(task.images?.length || 0) < 10 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Upload Image
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-default pt-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            {task.created_profile && (
              <>
                <span>Created by</span>
                <Avatar name={task.created_profile.display_name} size={16} />
                <span>{task.created_profile.display_name}</span>
              </>
            )}
            <span>· {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
          </div>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-red-400">Delete this task?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteTask(task.id);
                  onClose();
                }}
              >
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
