const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
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
                            .videoFilters('fade=out:st=0:d=0.5')
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
    return new Promise((resolve, reject) => {
        const outputFile = `${dir}/merged_output.mp4`;

        fs.readdir(copyDir, (err, files) => {
            if (err) {
                return reject('Error reading directory: ' + err);
            }

            const videoFiles = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
            if (videoFiles.length === 0) {
                return resolve('No video files found to merge');
            }

            const command = ffmpeg();
            videoFiles.forEach(file => {
                const videoFilePath = path.join(copyDir, file);
                command.input(videoFilePath);
            });

            command
                .on('end', () => {
                    console.log("Merge is done");
                    resolve("Merge is done");
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                    reject('Error: ' + err);
                })
                .mergeToFile(outputFile);
        });
    });
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

        const fadeMessage = await fadeEffect();
        console.log(fadeMessage);

        const mergeMessage = await mergeVideo();
        console.log(mergeMessage);

        const emptyMessage2 = await empty_copy_video();
        console.log(emptyMessage2);



    } catch (err) {
        console.error(err);
    }
}

main();
