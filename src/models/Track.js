class Track {
	constructor(id, title, artist, album) {
		this._id = id;
		this._title = title;
		this._artist = artist;
		this._album = album;
		this._spotifyUri = null;
	}
	// returns an encoded string for the search endpoint
	toString() {
		// testing showed that just providing the track and artist gives the
		// best results when searching, if the provided album name isn't precise
		// then the search doesn't find anything
		return encodeURIComponent('track:' + this._title.replace(/\ \(.*/g, '') + ' artist:' + this._artist.replace(/\ \& .*/g, ''));
	}
}


export default Track;