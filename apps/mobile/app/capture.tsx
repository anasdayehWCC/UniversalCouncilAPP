import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { getStorage } from '@careminutes/core/storage';

export default function Capture() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) stopRecording();
    };
  }, []);

  async function startRecording() {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
            Alert.alert('Permission needed', 'Microphone permission is required to record audio.');
            return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      
      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1000);
      }, 1000);
      
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    if (!recording) return;
    
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        
        if (uri) {
            await saveRecording(uri);
        }
    } catch (error) {
        console.error('Failed to stop recording', error);
    }
    
    setRecording(null);
  }

  async function saveRecording(uri: string) {
    try {
        const id = await getStorage().addRecording({
            fileUri: uri,
            fileName: `Recording ${new Date().toLocaleString()}`,
            mimeType: 'audio/m4a', // expo-av default
            createdAt: new Date(),
            duration: duration,
            status: 'pending',
            metadata: {
                case_reference: 'Unassigned', // TODO: Add case selection
                visit_type: 'In-person',
            }
        });
        console.log('Recording saved with ID:', id);
        Alert.alert('Saved', 'Recording saved to offline queue.', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error) {
        console.error('Failed to save recording', error);
        Alert.alert('Error', 'Failed to save recording to database.');
    }
  }

  function formatDuration(ms: number) {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.timerContainer}>
            <Text style={styles.timer}>{formatDuration(duration)}</Text>
            <Text style={styles.status}>{isRecording ? 'Recording...' : 'Ready to record'}</Text>
        </View>

        <View style={styles.controls}>
            {!isRecording ? (
                <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                    <View style={styles.recordInner} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                    <View style={styles.stopInner} />
                </TouchableOpacity>
            )}
        </View>
        
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // gray-900
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 64,
    fontWeight: '200',
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
  status: {
    fontSize: 16,
    color: '#9ca3af', // gray-400
    marginTop: 8,
  },
  controls: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444', // red-500
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopInner: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#ef4444', // red-500
  },
  cancelButton: {
    padding: 16,
  },
  cancelText: {
    color: 'white',
    fontSize: 16,
  },
});
