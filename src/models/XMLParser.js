// private members
var xml2js = require('xml2js');
var Playlist = require('./Playlist');
var Track = require('./Track').default;
const reader = new FileReader();
// Constructor
class XMLParser {
	constructor() {
		this._parsedXml = null;
		this._playlists = [];
		this._tracks = [];
		this._order = [];
	}
	// Methods
	parse(file, callback) {
		var parser = new xml2js.Parser();
		var self = this;

		parser.parseString(file, function (err, result) {
			if (err) {
				var err = new Error('Failed to parse XML');
				return callback(err);
			}

			self._parsedXml = result;
			return callback(null);
		});
	}
	getPlaylists() {
		var playlists = this._parsedXml.plist.dict[0].array[0].dict;

		for (var i = 0; i < playlists.length; i++) {

			// push new playlist to collection
			var newPlaylist = new Playlist(playlists[i].string[0]);

			// get track ids belonging to playlist
			if (typeof playlists[i].array !== 'undefined') {
				var playlistTracksArray = playlists[i].array[0].dict;

				for (var j = 0; j < playlistTracksArray.length; j++) {
					newPlaylist.addTrackId(playlistTracksArray[j].integer[0]);
				}
			}

			this._playlists.push(newPlaylist);
		}
	}
	getTracks() {
		var tracks = this._parsedXml.plist.dict[0].dict[0].dict;

		// get keys and construct an array
		var tracksKeys = Object.keys(tracks).map(function (key) {
			return tracks[key];
		});

		for (var i = 0; i < tracks.length; i++) {

			// The album index can vary depending on the presence of other meta-data
			// Id, Name, Artist are always in order, so we can index them manually,
			// for the album, we search the keys for the 'Album' information
			// we subtract 1 to account for the id which is in the integer collection
			var albumIndex = tracksKeys[i].key.indexOf('Album') - 1;
			var album;

			if (albumIndex < 0) {
				// no album information found
				album = null;
			} else {
				album = tracks[i].string[albumIndex];
			}

			var newTrack = new Track(tracks[i].integer[0],
				tracks[i].string[0],
				tracks[i].string[1],
				album); // Album

			this._tracks.push(newTrack);
		}
	}
	getTrackOrder(){
		this._parsedXml.plist.dict[0].array[0].dict[0].array[0].dict.forEach(element => {
			this._order.push(parseInt(element.integer[0]));
		});
	}
	getTrackById(id) {

		// remember to return from the correct function
		// returning from the anonymous function only returns to
		// getTrackById() which then needs to return to its caller
		return this._tracks.find(function (track) {
			return track._id === id;
		});
	}
	getPlaylistByName(name) {
		return this._playlists.find(function (playlist) {
			return playlist._name === name;
		});
	}
}








module.exports = XMLParser;