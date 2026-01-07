import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

export class LogsService {
  constructor(userId) {
    this.userId = userId;
  }

  async addCallLog(callData) {
    try {
      const log = {
        ...callData,
        userId: this.userId,
        timestamp: Timestamp.now(),
        duration: callData.duration || 0
      };

      const docRef = await addDoc(collection(db, 'callLogs'), log);
      return { id: docRef.id, ...log };
    } catch (error) {
      console.error('Error adding call log:', error);
      throw error;
    }
  }

  async getCallLogs(filters = {}) {
    try {
      let q = query(
        collection(db, 'callLogs'),
        where('participants', 'array-contains', this.userId),
        orderBy('timestamp', 'desc')
      );

      if (filters.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.type && filters.type !== 'all') {
        q = query(q, where('type', '==', filters.type));
      }

      const querySnapshot = await getDocs(q);
      const logs = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      return logs;
    } catch (error) {
      console.error('Error getting call logs:', error);
      return [];
    }
  }

  async getFilteredLogs(filterType) {
    const logs = await this.getCallLogs();
    
    switch(filterType) {
      case 'missed':
        return logs.filter(log => log.status === 'missed');
      
      case 'incoming':
        return logs.filter(log => 
          log.participants.includes(this.userId) && 
          log.callerId !== this.userId
        );
      
      case 'outgoing':
        return logs.filter(log => log.callerId === this.userId);
      
      default:
        return logs;
    }
  }

  async getCallStats() {
    try {
      const logs = await this.getCallLogs();
      
      return {
        total: logs.length,
        missed: logs.filter(log => log.status === 'missed').length,
        incoming: logs.filter(log => 
          log.participants.includes(this.userId) && 
          log.callerId !== this.userId
        ).length,
        outgoing: logs.filter(log => log.callerId === this.userId).length,
        video: logs.filter(log => log.type === 'video').length,
        audio: logs.filter(log => log.type === 'audio').length
      };
    } catch (error) {
      console.error('Error getting call stats:', error);
      return null;
    }
  }

  async deleteCallLog(logId) {
    try {
      await deleteDoc(doc(db, 'callLogs', logId));
      return true;
    } catch (error) {
      console.error('Error deleting call log:', error);
      throw error;
    }
  }
}