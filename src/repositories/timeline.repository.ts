import { db } from '@/services/firebase.config';
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';
import { TimelineEvent } from '@/types/timeline.types';

export class TimelineRepository {
  /**
   * Saves a new domain event into timelineEvents/{id}
   */
  async createEvent(event: TimelineEvent): Promise<TimelineEvent> {
    try {
      const eventRef = doc(db, 'timelineEvents', event.id);
      await setDoc(eventRef, event);
      return event;
    } catch (error) {
      console.error(`[TimelineRepository] Error creating event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all timeline events for a specific case in chronological order
   */
  async getEventsByCase(caseId: string): Promise<TimelineEvent[]> {
    try {
      const eventsRef = collection(db, 'timelineEvents');
      const q = query(eventsRef, where('caseId', '==', caseId), orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      const events: TimelineEvent[] = [];
      querySnapshot.forEach((d) => events.push(d.data() as TimelineEvent));
      return events;
    } catch (error) {
      console.error(`[TimelineRepository] Error fetching events for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches recent timeline events for a specific user
   */
  async getEventsByUser(userId: string, limitCount = 20): Promise<TimelineEvent[]> {
    try {
      const eventsRef = collection(db, 'timelineEvents');
      const q = query(eventsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const events: TimelineEvent[] = [];
      querySnapshot.forEach((d) => events.push(d.data() as TimelineEvent));
      return events;
    } catch (error) {
      console.error(`[TimelineRepository] Error fetching events for user ${userId}:`, error);
      throw error;
    }
  }
}

export const timelineRepository = new TimelineRepository();
