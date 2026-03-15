/**
 * Course Progress API
 * POST /api/courses/progress
 * 
 * Updates lesson progress for enrolled students
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentId, lessonId, isCompleted, watchPositionSeconds, userId } = body;
    const supabaseAdmin = getSupabaseAdmin();

    if (!enrollmentId || !lessonId) {
      return NextResponse.json(
        { error: 'Enrollment ID and lesson ID are required' },
        { status: 400 }
      );
    }

    // Check enrollment exists
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('id', enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Upsert progress
    const { data: existingProgress } = await supabaseAdmin
      .from('lesson_progress')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (isCompleted !== undefined) {
        updateData.is_completed = isCompleted;
        if (isCompleted) updateData.completed_at = new Date().toISOString();
      }
      if (watchPositionSeconds !== undefined) {
        updateData.watch_position_seconds = watchPositionSeconds;
      }

      await supabaseAdmin
        .from('lesson_progress')
        .update(updateData)
        .eq('id', (existingProgress as { id: string }).id);
    } else {
      await supabaseAdmin
        .from('lesson_progress')
        .insert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          student_user_id: userId || null,
          is_completed: isCompleted || false,
          watch_position_seconds: watchPositionSeconds || 0,
          completed_at: isCompleted ? new Date().toISOString() : null,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
