import { spawn } from 'child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class VideoHandler {
  // ... other methods ...

  /**
   * Extract audio from video file using ffmpeg directly
   */
  async extractAudio(videoPath: string): Promise<string> {
    const audioPath = videoPath.replace(/\.(mp4|webm|mkv)$/, '.wav');

    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpeg.path, [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'pcm_s16le',
        '-ar', '16000', // 16kHz sample rate
        '-ac', '1', // Mono
        '-y', // Overwrite output
        audioPath
      ]);

      let stderr = '';

      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(audioPath);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpegProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Alternative: Using exec for simpler cases
   */
  async extractAudioSimple(videoPath: string): Promise<string> {
    const audioPath = videoPath.replace(/\.(mp4|webm|mkv)$/, '.wav');
    
    const command = `${ffmpeg.path} -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 -y "${audioPath}"`;
    
    try {
      await execAsync(command);
      return audioPath;
    } catch (error) {
      throw new Error(`Failed to extract audio: ${error}`);
    }
  }
}