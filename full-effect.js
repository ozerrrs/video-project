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
var lock = new AsyncLock();
// //empty copy_video
// empty_copy_video(fs,path,copyDir);
// // Firsly divide video
// cutTheFile(fs, path, dir, ffmpeg, copyDir);
// //Slow fast active
// videoSlowAndFast(fs, path, copyDir, ffmpeg)


//  File of video Divided by 2 and send the the copy_video
function cutTheFile() {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                return console.error('Error reading directory', err);
            }

            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
            mp4Files.forEach(file => {
                const baseName = path.basename(file, path.extname(file));
                const outputFirstHalf = `${copyDir}/${baseName}_cut1.mp4`;
                const outputSecondHalf = `${copyDir}/${baseName}_cut2.mp4`;
                const videoFilePath = path.join(dir, file);

                ffmpeg.ffprobe(videoFilePath, (err, metaData) => {
                    if (err) {
                        console.error(err);
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
                        .on("end", () => console.log("First part done"))
                        .on('error', (err) => console.error(err))
                        .run();

                    ffmpeg()
                        .input(videoFilePath)
                        .inputOptions([`-ss ${halfDuration}`])
                        .outputOptions([`-t ${halfDuration}`])
                        .noAudio()
                        .output(outputSecondHalf)
                        .on("end", () => console.log("Second part done"))
                        .on('error', (err) => console.error(err))
                        .run();
                });
            });
        });


        let response = {
            json: () => Promise.resolve({ message: "Operation successful" })
        };

        response.json().then(json => {
            resolve("Second Function: " + JSON.stringify(json));
        }).catch(err => {
            reject(err);
        });
    });
}
//İf video name contain _cut1 ,video will more slow else video name contain _cut2 , vide will more fast
function videoSlowAndFast() {
    return new Promise((resolve, reject) => {
        fs.readdir(copyDir, (err, files) => {
            if (err) {
                return console.error('Error reading directory:', err);
            }

            const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

            mp4Files.forEach(file => {
                const baseName = path.basename(file, path.extname(file));
                if (baseName.indexOf("_cut1") != -1) {
                    const deletedLoc = `${copyDir}/${file}`;
                    const inputFile = path.resolve(`${deletedLoc}`);
                    const outputFile = path.resolve(`${copyDir}/${baseName}_slow.mp4`);
                    ffmpeg(inputFile)
                        .videoFilters('setpts=(PTS-STARTPTS)/0.5')
                        .audioFilters('atempo=0.5')
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




                } else if (baseName.indexOf("_cut2") != -1) {
                    const deletedLoc = `${copyDir}/${file}`;
                    const inputFile = path.resolve(`${deletedLoc}`);
                    const outputFile = path.resolve(`${copyDir}/${baseName}_fast.mp4`);
                    ffmpeg(inputFile)
                        .videoFilters('setpts=(PTS-STARTPTS)/3')
                        .audioFilters('atempo=3')
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


        let response = {
            json: () => Promise.resolve({ message: "Operation successful" })
        };

        response.json().then(json => {
            resolve("Third Function: " + JSON.stringify(json));
        }).catch(err => {
            reject(err);
        });
    });
}





function empty_copy_video() {
    return new Promise((resolve, reject) => {


        fs.readdir(copyDir, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                fs.unlink(path.join(copyDir, file), (err) => {
                    if (err) throw err;
                });
            }
        });
        resolve("first Function")
    })
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





function main() {
    empty_copy_video().then((data) => {
        console.log(data)
    }).then(() => {
        cutTheFile().then((data) => {
            console.log(data)
        }).then(() => {
            videoSlowAndFast().then((data) => {
                console.log(data)
            })
        })

    })
    // empty_copy_video();
    // cutTheFile()
    //  videoSlowAndFast();
    // empty_copy_video();






}

main();


