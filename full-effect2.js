const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPathStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPathStatic)
const fs = require('fs');
const path = require('path');
const dir = './video';
const copyDir = './copy-video'
const https = require("https");
const urlArray = [
    "https://videoai-uploads.univenn.com/94400f5c-428d-43a3-9a1e-92261f611b5a/Gd7w-lOzHHcQW54fNJsMS.mp4",
    "https://videoai-uploads.univenn.com/f31eabc9-7075-4fd1-af57-65b04d3c41b7/7i0jcH1xx_KmvERcmGFds.mp4",
    "https://videoai-uploads.univenn.com/a046a008-f02b-4e8b-b05b-6588bbafecee/CNKaPbvBuE28n60LtpEF_.mp4",
    "https://videoai-uploads.univenn.com/d2979344-63b7-4a36-9155-37905fde54b4/d2BLsjj6JB5QWNByNZcEI.mp4"
  ];
  
  if (!fs.existsSync('./video')) {
      fs.mkdirSync('./video');
  }
  async function urlConvertToArray(url, index) {
    return new Promise((resolve, reject) => {
        const filePath = path.resolve(`./video/url${index}.mp4`);
        const fileStream = fs.createWriteStream(filePath);

        https.get(url, function(res) {
            res.pipe(fileStream);

            fileStream.on("finish", function() {
                fileStream.close();
                console.log(`Downloaded url${index}.mp4`);
                resolve(filePath);
            });

            fileStream.on("error", function(err) {
                fs.unlink(filePath, () => reject(err));
            });
        }).on('error', reject);
    });
}
  

async function empty_copy_video() {
    return new Promise((resolve, reject) => {
        fs.readdir(copyDir, (err, files) => {
            if (err) return reject(err);

            const unlinkPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    fs.unlink(path.join(copyDir, file), err => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });

            Promise.all(unlinkPromises)
                .then(() => resolve("First Function: Empty Copy Directory"))
                .catch(reject);
        });
    });
}

async function cutTheFile() {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) return reject('Error reading directory: ' + err);

            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

            const cutPromises = mp4Files.map(file => {
                return new Promise((resolve, reject) => {
                    const baseName = path.basename(file, path.extname(file));
                    const outputFirstHalf = `${copyDir}/${baseName}_cut1.mp4`;
                    const outputSecondHalf = `${copyDir}/${baseName}_cut2.mp4`;
                    const videoFilePath = path.join(dir, file);

                    ffmpeg.ffprobe(videoFilePath, (err, metaData) => {
                        if (err) return reject(err);

                        const { duration } = metaData.format;
                        const halfDuration = duration / 2;

                        const cutFirstHalf = new Promise((resolve, reject) => {
                            ffmpeg()
                                .input(videoFilePath)
                                .inputOptions([`-ss 0`])
                                .outputOptions([`-t ${halfDuration}`])
                                .noAudio()
                                .output(outputFirstHalf)
                                .on("end", resolve)
                                .on('error', reject)
                                .run();
                        });

                        const cutSecondHalf = new Promise((resolve, reject) => {
                            ffmpeg()
                                .input(videoFilePath)
                                .inputOptions([`-ss ${halfDuration}`])
                                .outputOptions([`-t ${halfDuration}`])
                                .noAudio()
                                .output(outputSecondHalf)
                                .on("end", resolve)
                                .on('error', reject)
                                .run();
                        });

                        Promise.all([cutFirstHalf, cutSecondHalf])
                            .then(() => resolve())
                            .catch(reject);
                    });
                });
            });

            Promise.all(cutPromises)
                .then(() => resolve("Second Function: Cutting Files"))
                .catch(reject);
        });
    });
}

async function videoSlowAndFast() {
    return new Promise((resolve, reject) => {
        fs.readdir(copyDir, (err, files) => {
            if (err) return reject('Error reading directory: ' + err);

            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

            const processPromises = mp4Files.map(file => {
                return new Promise((resolve, reject) => {
                    const baseName = path.basename(file, path.extname(file));
                    const deletedLoc = `${copyDir}/${file}`;
                    const inputFile = path.resolve(deletedLoc);

                    if (baseName.indexOf("_cut1") != -1) {
                        const outputFile = path.resolve(`${copyDir}/${baseName}_slow.mp4`);
                        ffmpeg(inputFile)
                            .videoFilters('setpts=(PTS-STARTPTS)/0.5')
                            .audioFilters('atempo=0.5')
                            .output(outputFile)
                            .on('end', () => {
                                fs.unlink(deletedLoc, err => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            })
                            .on('error', reject)
                            .run();
                    } else if (baseName.indexOf("_cut2") != -1) {
                        const outputFile = path.resolve(`${copyDir}/${baseName}_fast.mp4`);
                        ffmpeg(inputFile)
                            .videoFilters('setpts=(PTS-STARTPTS)/3')
                            .audioFilters('atempo=3')
                            .output(outputFile)
                            .on('end', () => {
                                fs.unlink(deletedLoc, err => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            })
                            .on('error', reject)
                            .run();
                    } else {
                        resolve();
                    }
                });
            });

            Promise.all(processPromises)
                .then(() => resolve("Third Function: Processing Files"))
                .catch(reject);
        });
    });
}
async function fadeEffect() {
    return new Promise((resolve, reject) => {
        fs.readdir(copyDir, (err, files) => {
            if (err) {
                return reject('Error reading directory: ' + err);
            }

            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

            const fadePromises = mp4Files.map(file => {
                return new Promise((resolve, reject) => {
                    const baseName = path.basename(file, path.extname(file));
                    const deletedLoc = `${copyDir}/${file}`;
                    const inputFile = path.resolve(deletedLoc);

                    if (baseName.includes("slow")) {
                        const outputFile = path.resolve(`${copyDir}/${baseName}_fade_in.mp4`);
                        ffmpeg(inputFile)
                            .videoFilters('fade=in:st=0:d=1')
                            .output(outputFile)
                            .on('end', () => {
                                fs.unlink(deletedLoc, err => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            })
                            .on('error', err => {
                                console.error(`Error executing FFmpeg command: ${err.message}`);
                                reject(err);
                            })
                            .run();
                    } else if (baseName.includes("fast")) {
                        const outputFile = path.resolve(`${copyDir}/${baseName}_fade_out.mp4`);
                        ffmpeg(inputFile)
                            .videoFilters([
                                {
                                    filter: 'xfade',
                                    options: {
                                      transition: 'smoothup ', // distance: dissolve circleclose hblur
                                      duration: 4,
                                      offset: Math.max(0, duration - 2) // Adjust offset to start transition before the end
                                    },
                                    inputs: ['0:v', '1:v'],
                                    outputs: 'v'
                                  }
                            ])
                            .output(outputFile)
                            .on('end', () => {
                                fs.unlink(deletedLoc, err => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            })
                            .on('error', err => {
                                console.error(`Error executing FFmpeg command: ${err.message}`);
                                reject(err);
                            })
                            .run();
                    } else {
                        resolve();
                    }
                });
            });

            Promise.all(fadePromises)
                .then(() => resolve("Fourth Fade effect applied successfully"))
                .catch(reject);
        });
    });
}

async function mergeVideo() {
    const outputFile = `${dir}/merged_output.mp4`;

    try {
        const files = await fs.promises.readdir(copyDir);
        const videoFiles = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

        if (videoFiles.length === 0) {
            return 'No video files found to merge';
        }

        // Function to merge two videos
        const mergeTwoVideos = (video1, video2, output) => {
            return new Promise((resolve, reject) => {
                ffmpeg()
                    .input(video1)
                    .input(video2)
                    .on('end', () => {
                        console.log(`Merged ${path.basename(video1)} and ${path.basename(video2)} into ${path.basename(output)}`);
                        resolve(output);
                    })
                    .on('error', (err) => {
                        console.error(`Error merging ${path.basename(video1)} and ${path.basename(video2)}:`, err);
                        reject(err);
                    })
                    .mergeToFile(output);
            });
        };

        // Process videos in pairs
        let tempFiles = [];
        for (let i = 0; i < videoFiles.length; i += 2) {
            const video1 = path.join(copyDir, videoFiles[i]);
            const video2 = i + 1 < videoFiles.length ? path.join(copyDir, videoFiles[i + 1]) : null;
            
            const tempOutput = path.join(copyDir, `temp_merged_${Math.floor(i / 2)}.mp4`);
            tempFiles.push(tempOutput);
            
            if (video2) {
                await mergeTwoVideos(video1, video2, tempOutput);
            } else {
                // If odd number of videos, copy the last video as is
                await fs.promises.copyFile(video1, tempOutput);
                console.log(`Copied ${path.basename(video1)} as ${path.basename(tempOutput)}`);
            }
        }


        for (const tempFile of videoFiles) {
            const filePath = path.join(copyDir, tempFile);
            console.log(filePath);
            fs.unlink(filePath, err => {
                if (err) return reject(err);
            });
        }

        return 'Merge is done';
    } catch (err) {
        console.error('Error:', err);
        return 'Error: ' + err;
    }
}

async function mergeWithSmoothEffect(){
    try {
        const isMP4 = (file) => path.extname(file).toLowerCase() === '.mp4';
          // Read the directory and get the list of MP4 files
          const files = await fs.promises.readdir(copyDir);
          const mp4Files = files.filter(isMP4).map(file => path.join(copyDir, file));
      
          // Ensure there are at least two MP4 files for the transition
          if (mp4Files.length < 2) {
            console.error('Not enough MP4 files in the directory');
            return;
          }
      
          let input1 = mp4Files[0];
          let outputFile;
          const finalOutputFile = path.join(dir, `resultvideo.mp4`);

          for (let i = 1; i < mp4Files.length; i++) {
            const input2 = mp4Files[i];
            outputFile = (i === mp4Files.length - 1) ? finalOutputFile : path.join(copyDir, `${i}_video.mp4`);
      
            try {
              // Wait for ffprobe to get metadata
              const metadata = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(input1, (err, metadata) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(metadata);
                  }
                });
              });
      
              const duration = metadata.format.duration;
      
              // Process video with ffmpeg
              await new Promise((resolve, reject) => {
                ffmpeg()
                  .input(input1)
                  .input(input2)
                  .complexFilter([
                    {
                      filter: 'xfade',
                      options: {
                        transition: 'smoothup', // transition type
                        duration: 4,
                        offset: Math.max(0, duration - 2) // Adjust offset to start transition before the end
                      },
                      inputs: ['0:v', '1:v'],
                      outputs: 'v'
                    }
                  ])
                  .outputOptions([
                    '-map', '[v]',
                    '-map', '0:a?',
                    '-map', '1:a?'
                  ])
                  .outputOptions('-pix_fmt yuv420p') // Ensure compatibility with most players
                  .output(outputFile)
                  .on('end', () => {
                    console.log(`Processing finished for video ${i}!`);
                    input1 = outputFile; // Set the output file as the new input for the next iteration
                    resolve();
                  })
                  .on('error', (err) => {
                    console.error('An error occurred: ' + err.message);
                    reject(err);
                  })
                  .run();
              });


      
            } catch (err) {
              console.error('Error:', err);
            }
          }
        } catch (err) {
          console.error('Error reading directory:', err);
        }

}


async function main() {


    try {
        const downloadPromises = urlArray.map((url, index) => urlConvertToArray(url, index + 1));
        await Promise.all(downloadPromises);
        console.log("All videos downloaded");

        const emptyMessage = await empty_copy_video();
        console.log(emptyMessage);

        const cutMessage = await cutTheFile();
        console.log(cutMessage);

        const processMessage = await videoSlowAndFast();
        console.log(processMessage);

        // const fadeMessage = await fadeEffect();
        // console.log(fadeMessage);

        const mergeMessage = await mergeVideo();
        console.log(mergeMessage);

        const mergeSmooth = await mergeWithSmoothEffect();
        console.log(mergeSmooth);

        const emptyMessage2 = await empty_copy_video();
        console.log(emptyMessage2);



    } catch (err) {
        console.error(err);
    }
}

main();
