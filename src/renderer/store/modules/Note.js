import db from '../../datastore-notes';
import converter from '../../converter';

const octokit = require('@octokit/rest')({
  requestMedia: 'application/vnd.github.v3+json',
  headers: {
    'user-agent': 'octokit/rest.js v1.2.3'
  }
});

const state = {
  notes: [],
  languageSelected: 'all',
  gistsSelected: false,
};

const mutations = {
  LOAD_NOTES(state, notes) {
    state.languageSelected = 'all';

    state.notes = notes;
  },
  ADD_NOTE(state, note) {
    state.notes.push(note);
  },
  DELETE_NOTE(state, note) {
    state.notes = state.notes.filter(n => n._id !== note._id);

    state.languageSelected = 'all';
  },
  SELECT_LANGUAGE(state, language) {
    state.languageSelected = language;
  },
  SELECT_GISTS(state, gistsSelected) {
    state.gistsSelected = gistsSelected;
  },
};

const actions = {
  loadNotes(store) {
    if (store.state.gistsSelected) {
      store.commit('LOAD_NOTES', []);

      octokit.authenticate({
        type: 'token',
        token: store.rootState.Settings.settings.githubPersonalAccessToken
      });

      octokit.gists.getAll().then((res) => {
        const promises = [];

        res.data.forEach(gist => {
          promises.push(octokit.gists.get({id: gist.id}))
        });

        Promise.all(promises).then(values => {
          const notes = [];

          values.forEach(gistDetailed => {
            notes.push(converter.gistToNote(gistDetailed.data));
          });

          store.commit('LOAD_NOTES', notes);
        });
      });
    } else {
      db.find({}, (err, notes) => {
        if (!err) {
          store.commit('LOAD_NOTES', notes);
        }
      });
    }
  },
  addNote(store, note) {
    return db.insert(note, (err, note) => {
      if (!err) {
        store.commit('ADD_NOTE', note);
      }
    });
  },
  updateNote(store, note) {
    return db.update({_id: note._id}, note, {}, err => {
      if (!err) {
        store.dispatch('loadNotes');
      }
    });
  },
  deleteNote(store, note) {
    return db.remove({_id: note._id}, {}, err => {
      if (!err) {
        store.commit('DELETE_NOTE', note);
      }
    });
  },
  selectLanguage(store, language) {
    store.commit('SELECT_LANGUAGE', language);
  },
  selectGists(store, gists) {
    store.commit('SELECT_GISTS', gists);
    store.dispatch('loadNotes');
  },
};

const getters = {
  notes: state => state.notes,
  noteById: state => id => state.notes.find(note => note._id === id),
  languages: state => {
    const map = new Map();

    if (state.notes.length > 0) {
      state.notes.forEach(note => {
        Object.keys(note.files).forEach(key => {
          if (map.has(note.files[key].language)) {
            map.set(
              note.files[key].language,
              map.get(note.files[key].language) + 1
            );
          } else {
            map.set(note.files[key].language, 1);
          }
        });
      });
    }
    return map;
  },
  totalFiles() {
    let total = 0;

    state.notes.forEach(note => {
      total += Object.keys(note.files).length;
    });

    return total;
  },
  languageSelected: state => state.languageSelected,
  gistsSelected: state => state.gistsSelected,
};

export default {
  state,
  mutations,
  actions,
  getters,
};
