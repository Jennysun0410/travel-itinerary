'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiFetch } from '../../../../lib/api';
import type { Order, TimelineSlot, TripDestination } from '@travel/shared';
import { resolveTimezone } from '@travel/shared';
import LocalDatetime from '../../../../components/LocalDatetime';

interface Props { params: { id: string } }

type SlottedOrder = TimelineSlot & { order: Order };
type TimelineByDay = Record<string, SlottedOrder[]>;

function DraggableOrderCard({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `pool-${order.id}`, data: { type: 'pool', order } });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, cursor: 'grab' };
  return (
    <div ref={setNodeRef} style={{ ...style, border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', background: '#fff', marginBottom: 6 }} {...listeners} {...attributes}>
      <strong style={{ fontSize: 13 }}>{order.vendor}</strong>
      <span style={{ fontSize: 12, color: '#666', marginLeft: 6 }}>{order.type}</span>
      <p style={{ margin: '2px 0', fontSize: 11, color: '#999' }}>{order.bookingRef}</p>
    </div>
  );
}

function SortableSlotCard({ slot, destinations }: { slot: SlottedOrder; destinations: TripDestination[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id, data: { type: 'slot', slot } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const tz = resolveTimezone(slot.order.bookingDate ?? null, destinations);
  return (
    <div ref={setNodeRef} style={{ ...style, border: '1px solid #b3d4ff', borderRadius: 6, padding: '8px 12px', background: '#eef4ff', marginBottom: 6, cursor: 'grab' }} {...listeners} {...attributes}>
      <strong style={{ fontSize: 13 }}>{slot.order.vendor}</strong>
      <span style={{ fontSize: 12, color: '#555', marginLeft: 6 }}>{slot.order.type}</span>
      {slot.order.startDatetime && <p style={{ margin: '2px 0', fontSize: 11, color: '#555' }}><LocalDatetime utcIso={slot.order.startDatetime} timezone={tz} /></p>}
      <p style={{ margin: '2px 0', fontSize: 11, color: '#888' }}>Placed by {slot.placedByName}</p>
    </div>
  );
}

function DayColumn({ day, slots, tripId, destinations, onSlotMoved, onSlotRemoved }: {
  day: string; slots: SlottedOrder[]; tripId: string; destinations: TripDestination[];
  onSlotMoved: (slotId: string, newDay: string) => void;
  onSlotRemoved: (slotId: string, orderId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}`, data: { day } });
  return (
    <div ref={setNodeRef} style={{ minWidth: 180, flex: '0 0 180px', border: `2px ${isOver ? 'solid #0070f3' : 'dashed #ddd'}`, borderRadius: 8, padding: 10, background: isOver ? '#f0f7ff' : '#fafafa' }}>
      <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#333' }}>{day}</h4>
      <SortableContext items={slots.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {slots.map(slot => (
          <div key={slot.id} style={{ position: 'relative' }}>
            <SortableSlotCard slot={slot} destinations={destinations} />
            <button onClick={() => onSlotRemoved(slot.id, slot.orderId)}
              style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14 }}>×</button>
          </div>
        ))}
      </SortableContext>
    </div>
  );
}

export default function TimelinePage({ params }: Props) {
  const tripId = params.id;
  const [timeline, setTimeline] = useState<TimelineByDay>({});
  const [unscheduled, setUnscheduled] = useState<Order[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadTimeline = useCallback(async () => {
    const [tl, orders] = await Promise.all([
      apiFetch<TimelineByDay>(`/timeline/trips/${tripId}/timeline`),
      apiFetch<Order[]>(`/orders/trips/${tripId}/orders`),
    ]);
    setTimeline(tl);

    const scheduledIds = new Set(Object.values(tl).flatMap(slots => slots.map(s => s.orderId)));
    setUnscheduled(orders.filter(o => !scheduledIds.has(o.id)));
  }, [tripId]);

  // Load trip dates and destinations for day columns and timezone resolution
  useEffect(() => {
    apiFetch<{ startDate: string; endDate: string; destinations?: TripDestination[] }>(`/trips/${tripId}`).then(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const d: string[] = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        d.push(dt.toISOString().slice(0, 10));
      }
      setDays(d);
      setDestinations(trip.destinations ?? []);
    }).catch(console.error);
    loadTimeline();
  }, [tripId, loadTimeline]);

  // 5-second polling for collaboration sync
  useEffect(() => {
    pollingRef.current = setInterval(loadTimeline, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadTimeline]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { type: string; order?: Order; slot?: SlottedOrder };
    if (data.type === 'pool') setActiveOrder(data.order ?? null);
    else if (data.type === 'slot') setActiveOrder(data.slot?.order ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { type: string; order?: Order; slot?: SlottedOrder };
    const overId = String(over.id);

    // Drop from pool onto a day column
    if (activeData.type === 'pool' && overId.startsWith('day-')) {
      const day = overId.replace('day-', '');
      const order = activeData.order!;

      // Optimistic update
      setUnscheduled(u => u.filter(o => o.id !== order.id));
      const mockSlot = { id: `tmp-${order.id}`, tripId, orderId: order.id, day, position: (timeline[day] ?? []).length, placedBy: '', placedByName: 'You', createdAt: '', updatedAt: '', order } as SlottedOrder;
      setTimeline(t => ({ ...t, [day]: [...(t[day] ?? []), mockSlot] }));

      try {
        await apiFetch(`/timeline/trips/${tripId}/timeline`, {
          method: 'POST',
          body: JSON.stringify({ order_id: order.id, day, position: mockSlot.position }),
        });
        await loadTimeline();
      } catch {
        await loadTimeline();
      }
      return;
    }

    // Drop existing slot onto a different day column
    if (activeData.type === 'slot' && overId.startsWith('day-')) {
      const newDay = overId.replace('day-', '');
      const slot = activeData.slot!;
      if (slot.day === newDay) return;

      setTimeline(t => {
        const prev = { ...t };
        prev[slot.day] = (prev[slot.day] ?? []).filter(s => s.id !== slot.id);
        const updated = { ...slot, day: newDay };
        prev[newDay] = [...(prev[newDay] ?? []), updated];
        return prev;
      });

      try {
        await apiFetch(`/timeline/${slot.id}`, { method: 'PATCH', body: JSON.stringify({ day: newDay }) });
        await loadTimeline();
      } catch {
        await loadTimeline();
      }
    }
  };

  const handleSlotRemoved = async (slotId: string, orderId: string) => {
    const removedSlot = Object.values(timeline).flat().find(s => s.id === slotId);
    if (!removedSlot) return;

    setTimeline(t => {
      const prev = { ...t };
      prev[removedSlot.day] = (prev[removedSlot.day] ?? []).filter(s => s.id !== slotId);
      return prev;
    });
    const order = removedSlot.order;
    setUnscheduled(u => [...u, order]);

    await apiFetch(`/timeline/${slotId}`, { method: 'DELETE' });
    void orderId;
  };

  const handleSlotMoved = () => { /* handled in drag end */ };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 16, padding: 24, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        {/* Order pool */}
        <div style={{ width: 200, flexShrink: 0, overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Unscheduled Orders</h3>
          {unscheduled.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>All orders are on the timeline.</p>}
          {unscheduled.map(order => <DraggableOrderCard key={order.id} order={order} />)}
        </div>

        {/* Timeline columns */}
        <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 12, paddingBottom: 8 }}>
          {days.map(day => (
            <DayColumn key={day} day={day} slots={timeline[day] ?? []} tripId={tripId} destinations={destinations}
              onSlotMoved={handleSlotMoved} onSlotRemoved={handleSlotRemoved} />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeOrder && (
          <div style={{ border: '1px solid #0070f3', borderRadius: 6, padding: '8px 12px', background: '#e8f0fe', opacity: 0.9 }}>
            <strong style={{ fontSize: 13 }}>{activeOrder.vendor}</strong>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
