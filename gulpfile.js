const gulp = require('gulp');
const { join } = require('path');
const { ensureDir, writeFile, remove } = require('fs-extra');

const { rooms, scenes } = require('./scenes.json');

const scenesDir = join(process.cwd(), 'scenes');
const sceneProfilesDir = join(scenesDir, 'profiles');
const sceneButtonsDir = join(scenesDir, 'buttons');

function rotate(array) {
  const temp = array.shift();
  array.push(temp);
}

function clearScenesFolder() {
  return remove(scenesDir);
}

function ensureSceneFolder() {
  return ensureDir(sceneProfilesDir)
    .then(() => { return ensureDir(sceneButtonsDir)});
}

function ensureRoomFolders() {
  return rooms
    .slice(0)
    .map(room => ensureDir(join(sceneProfilesDir, room.id)))
    .reduce((promiseChain, currentPromise) => {
      return promiseChain.then(currentPromise);
    }, Promise.resolve())
}

function generateButtonYAML(scenes, room) {
  let buttonsYAML = '';
  
  scenes.slice(0).map(scene => {
    buttonsYAML += `- type: call-service
  icon: ${scene.icon}
  name: ${scene.name}
  action_name: ${scene.button}
  service: scene.turn_on
  service_data:
    entity_id: scene.${scene.id}_${room.id}
`;
  });

  return buttonsYAML;
}

function generateSceneYAML(scene, room) {
  let colors = scene.colors.slice(0);
  let sceneYAML = `- name: ${scene.name} ${room.name}
  icon: ${scene.icon}
  entities:`;

  room.lights.slice(0).map(light => {
    rotate(colors);
    sceneYAML += `
    ${light}:
      state: on
      rgb_color: ${colors[0]}
      brightness: 254`;
  });

  if (room.switches) {
    room.switches.slice(0).map(switchId => {
      sceneYAML += `
    ${switchId}:
      state: ${(scene.switch || false) ? 'on' : 'off'}`;
    });
  }

  return `${sceneYAML}\n`;
}

function generateSceneProfiles() {
  return rooms
    .slice(0)
    .map(room => scenes
      .slice(0)
      .map((scene) => {
        const sceneConfig = generateSceneYAML(scene, room);

        return writeFile(join(sceneProfilesDir, room.id, `${scene.id}.yaml`), sceneConfig);
      }))
    .reduce((finalArr, currentArr) => {
      finalArr = finalArr.concat(currentArr);
      return finalArr;
    }, [])
    .reduce((promiseChain, currentPromise) => {
      return promiseChain.then(currentPromise);
    }, Promise.resolve());
}
function generateSceneButtons() {
  return rooms
    .slice(0)
    .map(room => {
      const buttonYAML = generateButtonYAML(scenes, room);
      return writeFile(join(sceneButtonsDir, `${room.id}.yaml`), buttonYAML);
    })
    .reduce((promiseChain, currentPromise) => {
      return promiseChain.then(currentPromise);
    }, Promise.resolve());
}

gulp.task('clean:scenes', clearScenesFolder);

gulp.task('build:scenes', gulp.series(
  clearScenesFolder,
  gulp.series(ensureSceneFolder, ensureRoomFolders),
  generateSceneProfiles,
  generateSceneButtons
));
