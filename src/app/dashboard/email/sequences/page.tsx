'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';

type Sequence = {
  id: string;
  name: string;
  trigger: 'new_subscriber' | 'product_purchase' | 'course_enrollment' | 'booking';
  is_active: boolean;
};

type Step = {
  sequence_id: string;
  position: number;
  delay_days: number;
  subject: string;
  body_html: string;
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [name, setName] = useState('Welcome Flow');
  const [trigger, setTrigger] = useState<Sequence['trigger']>('new_subscriber');

  useEffect(() => {
    void loadSequences();
  }, []);

  async function loadSequences() {
    const response = await fetch('/api/email/sequences');
    const json = await response.json();
    setSequences((json.sequences || []) as Sequence[]);
    setSteps((json.steps || []) as Step[]);
  }

  const groupedSteps = useMemo(() => {
    const map = new Map<string, Step[]>();
    for (const step of steps) {
      const current = map.get(step.sequence_id) || [];
      current.push(step);
      map.set(step.sequence_id, current.sort((a, b) => a.position - b.position));
    }
    return map;
  }, [steps]);

  async function createStarterSequence() {
    await fetch('/api/email/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        trigger,
        is_active: true,
        steps: [
          {
            position: 0,
            delay_days: 0,
            subject: 'Welcome {{first_name}}',
            body_html: '<p>Welcome to my list 👋</p>',
          },
          {
            position: 1,
            delay_days: 1,
            subject: 'Quick win for you',
            body_html: '<p>Here\'s one tactic you can use today.</p>',
          },
        ],
      }),
    });

    await loadSequences();
  }

  async function toggleSequence(sequence: Sequence) {
    await fetch('/api/email/sequences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sequence.id,
        is_active: !sequence.is_active,
      }),
    });

    await loadSequences();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automated Sequences</h1>
        <p className="text-gray-600 dark:text-gray-400">Build drip campaigns triggered by subscriber and buyer events.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Create sequence</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sequence name" />
          <select
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as Sequence['trigger'])}
          >
            <option value="new_subscriber">New subscriber</option>
            <option value="product_purchase">Product purchase</option>
            <option value="course_enrollment">Course enrollment</option>
            <option value="booking">Booking completed</option>
          </select>
          <Button onClick={createStarterSequence}>Create Starter Flow</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sequences.map((sequence) => (
          <Card key={sequence.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{sequence.name}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trigger: {sequence.trigger}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sequence.is_active ? 'success' : 'default'}>{sequence.is_active ? 'Active' : 'Paused'}</Badge>
                <Button size="sm" variant="outline" onClick={() => void toggleSequence(sequence)}>
                  {sequence.is_active ? 'Pause' : 'Enable'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {(groupedSteps.get(sequence.id) || []).map((step) => (
                  <li key={`${sequence.id}-${step.position}`}>
                    Step {step.position + 1} · Delay {step.delay_days} day(s) · <span className="font-medium text-gray-900 dark:text-white">{step.subject}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
