"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { EventType, EventContextType, AddOrUpdateEventResult } from "@/types/event";

const EventContext = createContext<EventContextType | null>(null);

export const useEvents = () => useContext(EventContext)!;

export const EventProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<EventType[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("events");
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  const addEvent = (event: Omit<EventType, "id">): AddOrUpdateEventResult => {
    const newEvent = { ...event, id: uuidv4() };
    // Only check for overlap with events of the same organizer
    const userEvents = events.filter(e => e.organizer === newEvent.organizer);
    const overlap = userEvents.find((e) => isOverlap(e, newEvent));
    if (overlap) return { success: false, overlappingEvent: overlap };
    setEvents([...events, newEvent]);
    return { success: true };
  };

  const updateEvent = (updatedEvent: EventType): AddOrUpdateEventResult => {
    // Only check for overlap with events of the same organizer
    const userEvents = events.filter(e => e.organizer === updatedEvent.organizer && e.id !== updatedEvent.id);
    const overlap = userEvents.find(e => isOverlap(e, updatedEvent));
    if (overlap) return { success: false, overlappingEvent: overlap };
    setEvents(events.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
    return { success: true };
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventContext.Provider>
  );
};

// Utility Function for Overlap Check
function isOverlap(a: EventType, b: EventType) {
  const startA = new Date(a.startDateTime).getTime();
  const endA = new Date(a.endDateTime).getTime();
  const startB = new Date(b.startDateTime).getTime();
  const endB = new Date(b.endDateTime).getTime();

  return startA < endB && startB < endA;
}
