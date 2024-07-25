const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const fs = require('fs');
const path = require('path');
const dir = './video';
const copyDir = './copy-video'
const AsyncLock = require("async-lock");
const { rejects } = require('assert');
var lock = new AsyncLock();
// //empty copy_video
// empty_copy_video(fs,path,copyDir);
// // Firsly divide video
// cutTheFile(fs, path, dir, ffmpeg, copyDir);
// //Slow fast active
// videoSlowAndFast(fs, path, copyDir, ffmpeg)


//  File of video Divided by 2 and send the the copy_video
async function cutTheFile() {
    try {
        fs.readdir(dir, async (err, files) => {
            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
            const promises = mp4Files.map(file => new Promise((resolve, reject) => {
                const baseName = path.basename(file, path.extname(file));
                const outputFirstHalf = `${copyDir}/${baseName}_cut1.mp4`;
                const outputSecondHalf = `${copyDir}/${baseName}_cut2.mp4`;
                const videoFilePath = path.join(dir, file);

                ffmpeg.ffprobe(videoFilePath, (err, metaData) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const { duration } = metaData.format;
                    const halfDuration = duration / 2;

                    ffmpeg()
                        .input(videoFilePath)
                        .inputOptions([`-ss 0`])
                        .outputOptions([`-t ${halfDuration}`])
                        .noAudio()
                        .output(outputFirstHalf)
                        .on("end", () => {
                            console.log("First part done");
                            ffmpeg()
                                .input(videoFilePath)
                                .inputOptions([`-ss ${halfDuration}`])
                                .outputOptions([`-t ${halfDuration}`])
                                .noAudio()
                                .output(outputSecondHalf)
                                .on("end", () => {
                                    console.log("Second part done");
                                    resolve(); // Resolve promise when both parts are done
                                })
                                .on('error', (err) => reject(err))
                                .run();
                        })
                        .on('error', (err) => reject(err))
                        .run();
                });
            }));

            await Promise.all(promises); // Wait for all files to be processed
        }); // Asynchronous read directory
    } catch (err) {
        console.error('Error occurred in cutTheFile:', err);
    }
}
//İf video name contain _cut1 ,video will more slow else video name contain _cut2 , vide will more fast
async function videoSlowAndFast() {console.log("ayse")
    try {
        fs.readdir(dir, async (err, files) => { // Asynchronous directory read

        const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
        const promises = mp4Files.map(file => new Promise((resolve, reject) => {
            const baseName = path.basename(file, path.extname(file));
             if (baseName.indexOf("_cut1") !== -1) {
                const deletedLoc =  path.join(dir, file);
                const inputFile = deletedLoc;
                const outputFile = path.resolve(`${copyDir}/${baseName}_slow.mp4`);
                

                ffmpeg(inputFile)
                    .videoFilters('setpts=(PTS-STARTPTS)/0.5')
                    .audioFilters('atempo=0.5')
                    .output(outputFile)
                    .on('end', async () => {
                        console.log('FFmpeg slow command executed successfully.');
                        try {
                            await fs.unlink(deletedLoc);
                            console.log("deleted");
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', (err) => {
                        console.error(`Error executing FFmpeg slow command: ${err.message}`);
                        reject(err);
                    })
                    .run();
            } else if (baseName.indexOf("_cut2") !== -1) {
                const deletedLoc = path.resolve(`${copyDir}/${file}`);
                const inputFile = deletedLoc;
                const outputFile = path.resolve(`${copyDir}/${baseName}_fast.mp4`);

                ffmpeg(inputFile)
                    .videoFilters('setpts=(PTS-STARTPTS)/3')
                    .audioFilters('atempo=3')
                    .output(outputFile)
                    .on('end', async () => {
                        console.log('FFmpeg fast command executed successfully.');
                        try {
                            await fs.unlink(deletedLoc);
                            console.log("deleted");
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', (err) => {
                        console.error(`Error executing FFmpeg fast command: ${err.message}`);
                        reject(err);
                    })
                    .run();
            }
        }));

        await Promise.all(promises); // Wait for all promises to complete
        console.log('All video processing complete.');
   }); } catch (err) {
        console.error('Error occurred in videoSlowAndFast:', err);
    }
}

async function empty_copy_video() {
    try {
        fs.readdir(copyDir, async (err, files) => {
            for (const file of files) {
                const filePath = path.join(copyDir, file);
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('path/file.txt was deleted');
                }); // Asynchronous delete
            }
            console.log('Directory emptied successfully.');
        });
    } catch (err) {
        console.error('Error occurred:', err);
    }
}

function fadeEffect(fs, path, copyDir, lock) {
    lock.acquire("key1", function (done) {
        fs.readdir(copyDir, (err, files) => {
            if (err) {
                return console.error('Error reading directory:', err);
            }

            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

            mp4Files.forEach(file => {
                const baseName = path.basename(file, path.extname(file));
                if (baseName.indexOf("slow") != -1) {
                    const deletedLoc = `${copyDir}/${file}`;
                    const inputFile = path.resolve(`${deletedLoc}`);
                    const outputFile = path.resolve(`${copyDir}/${baseName}_fade_in.mp4`);
                    ffmpeg(inputFile)
                        .videoFilters('fade=in:s=30:n=15')
                        .output(outputFile)
                        .on('end', () => {
                            console.log('FFmpeg command executed successfully.');
                            fs.unlink(`${deletedLoc}`, function (err) {
                                console.log("deleted ")

                            })
                        })

                        .on('error', (err) => {
                            console.error(`Error executing FFmpeg command: ${err.message}`);
                        })

                        .run();




                } else if (baseName.indexOf("fast") != -1) {
                    const deletedLoc = `${copyDir}/${file}`;
                    const inputFile = path.resolve(`${deletedLoc}`);
                    const outputFile = path.resolve(`${copyDir}/${baseName}_fade_out.mp4`);
                    ffmpeg(inputFile)
                        .videoFilters('fade=out:s=15:n=7.5')
                        .output(outputFile)
                        .on('end', () => {
                            console.log('FFmpeg command executed successfully.');
                            fs.unlink(`${deletedLoc}`, function (err) {
                                console.log("deleted ")

                            })
                        })

                        .on('error', (err) => {
                            console.error(`Error executing FFmpeg command: ${err.message}`);
                        })

                        .run();

                } else {
                    console.error('Error reading directory:', err);

                }

            });
        });
        setTimeout(function () { done(); }, 10000)
    }, function (err, ret) {
        console.log("fade")
    }, {});

}
function mergeVideo(fs, path, dir, ffmpeg, copyDir, lock) {
    lock.acquire("key1", function (done) {
        const outputFile = `${dir}/merged_output.mp4`;

        fs.readdir(copyDir, (err, files) => {
            if (err) {
                return console.error('Error reading directory', err);
            }

            const videoFiles = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
            if (videoFiles.length === 0) {
                return console.log('No video files found to merge');
            }

            const command = ffmpeg();
            videoFiles.forEach(file => {
                const videoFilePath = path.join(copyDir, file);
                command.input(videoFilePath);
            });

            command
                .on('end', () => console.log("Merge is done"))
                .on('error', (err) => console.log('Error:', err))
                .mergeToFile(outputFile);
        });
        setTimeout(function () { done(); }, 10000)
    }, function (err, ret) { console.log("merge") }, {})

}
// function mergeSoftVideo(fs, path, dir, ffmpeg, copyDir) {
//     lock.acquire("key1", function (done) {
//         const outputFile = `${dir}/merged_output.mp4`;

//         fs.readdir(copyDir, (err, files) => {
//             if (err) {
//                 return console.error('Error reading directory', err);
//             }

//             const videoFiles = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
//             if (videoFiles.length === 0) {
//                 return console.log('No video files found to merge');
//             }

//             if (videoFiles.length < 2) {
//                 return console.log('At least two video files are required to merge');
//             }

//             const command = ffmpeg();

//             // Add the first two video files as input
//             const videoFilePath1 = path.join(copyDir, videoFiles[0]);
//             const videoFilePath2 = path.join(copyDir, videoFiles[1]);

//             command.input(videoFilePath1);
//             command.input(videoFilePath2);

//             // Add the color filter as a filter, not as an input
//             const complexFilter = `
//                 [0:v]format=pix_fmts=yuva420p,fade=t=out:st=9:d=1:alpha=1[iv0];
//                 [1:v]format=pix_fmts=yuva420p,fade=t=in:st=0:d=1:alpha=1[iv1];
//                 color=black:s=1280x720:d=15[bg];
//                 [bg][iv0]overlay[bg1];
//                 [bg1][iv1]overlay[outv]
//             `;

//             command
//                 .complexFilter(complexFilter, 'outv')
//                 .outputOptions('-map', '[outv]', '-map', '0:a?')
//                 .on('end', () => console.log("Merge is done"))
//                 .on('error', (err) => console.log('Error:', err))
//                 .save(outputFile);
//         });

//         setTimeout(function () { done(); }, 8000);
//     }, function (err, ret) {
//         console.log("lock1 release");
//     }, {});
// }





async function main() {


    // //empty copy_video
    await empty_copy_video()
    // // Firsly divide video
     await cutTheFile()

     console.log("ayse")
    // // //Slow fast active
    // await videoSlowAndFast()

    // fadeEffect(fs, path, copyDir, lock)

    // mergeVideo(fs, path, dir, ffmpeg, copyDir, lock)
    // // mergeSoftVideo(fs, path, dir, ffmpeg, copyDir)
    // empty_copy_video(fs, path, copyDir, lock)

}

main();


