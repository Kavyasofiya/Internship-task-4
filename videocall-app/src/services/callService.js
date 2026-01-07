import { db } from './firebase';
import { addDoc, collection, updateDoc, doc, getDoc } from 'firebase/firestore';

export class CallService {
  constructor(userId) {
    this.userId = userId;
    this.localStream = null;
    this.callData = null;
  }

  async startCall(recipientId, callType = 'video') {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      const callData = {
        callerId: this.userId,
        recipientId: recipientId,
        type: callType,
        status: 'initiated',
        startTime: new Date().toISOString(),
        participants: [this.userId, recipientId],
        timestamp: new Date()
      };

      const callRef = await addDoc(collection(db, 'callLogs'), callData);
      
      this.callData = {
        ...callData,
        id: callRef.id
      };
      
      return { 
        success: true, 
        callId: callRef.id, 
        localStream: this.localStream
      };
      
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.callData?.id) {
      const endTime = new Date();
      const startTime = new Date(this.callData.startTime);
      const duration = Math.floor((endTime - startTime) / 1000);

      try {
        await updateDoc(doc(db, 'callLogs', this.callData.id), {
          status: 'completed',
          endTime: endTime.toISOString(),
          duration: duration
        });
      } catch (error) {
        console.error('Error updating call log:', error);
      }
    }

    this.callData = null;
  }

  async missCall(callId) {
    await updateDoc(doc(db, 'callLogs', callId), {
      status: 'missed',
      endTime: new Date().toISOString()
    });
  }
}