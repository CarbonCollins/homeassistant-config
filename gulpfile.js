const gulp = require('gulp');
const { join } = require('path');
const { ensureDir, writeFile, remove } = require('fs-extra');
const yaml = require('json-to-pretty-yaml');

const { rooms, scenes } = require('./scenes.json');

const scenesDir = join(process.cwd(), 'scenes');

function rotate(array) {
  const temp = array.shift();
  array.push(temp);
}

function clearScenesFolder() {
  return remove(scenesDir);
}

function ensureSceneFolder() {
  return ensureDir(scenesDir);
}

function ensureRoomFolders() {
  return rooms
    .slice(0)
    .map(room => ensureDir(join(scenesDir, room.id)))
    .reduce((promiseChain, currentPromise) => {
      return promiseChain.then(currentPromise);
    }, Promise.resolve())
    .then(() => ensureDir(join(scenesDir, 'home')));
}

function generateScenes() {
  return rooms
    .slice(0)
    .map(room => scenes
      .slice(0)
      .map((scene) => {
        let rgbColors = scene.colors;
        const sceneConfig = yaml.stringify({
          name: scene.name,
          icon: scene.icon,
          entities: room.lights.slice(0).map(light => {
            rotate(rgbColors);
            return {
              [light]: {
                state: 'on',
                rgb_color: rgbColors[0],
                brightness: 254
              }
            }
          })
        });
        return writeFile(join(scenesDir, room.id, `${scene.id}.yaml`), sceneConfig);
      }))
    .reduce((finalArr, currentArr) => {
      finalArr = finalArr.concat(currentArr);
      return finalArr;
    }, [])
    .reduce((promiseChain, currentPromise) => {
      return promiseChain.then(currentPromise);
    }, Promise.resolve());
}

gulp.task('clean:scenes', clearScenesFolder);

gulp.task('build:scenes', gulp.series(
  clearScenesFolder,
  gulp.series(ensureSceneFolder, ensureRoomFolders),
  generateScenes
));
