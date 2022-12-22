# iTunes Playlist to Spotify Playlist

A TypeScript project to convert iTunes playlists into spotify playlists using the [NodeJS Spotify Web API wrapper](https://github.com/thelinmichael/spotify-web-api-node) built on top of @Poc275's [converter](https://github.com/Poc275/iTunes-to-Spotify). This is a project to spite Apple for raising their monthly fee from 9.99/month to 10.99/month. It's currently hosted on [heroku](https://itunes-spotify.herokuapp.com/).

## Road Map
- Queue multiple playlists
- Add songs to library and bypass playlist creation
- Refactor the steps process for readability

## Where to find it

https://itunes-spotify.herokuapp.com/

## How to use

URL Method:

1. Share your playlist
2. Copy the link
3. Follow the steps in the wizard

XML Method:

Open iTunes
1. Select a playlist in the sidebar
2. Choose File / Library / Export Playlist, then click the Format pop-up menu and choose XML.
    - [If you're running into problems check out this guide](https://www.wikihow.com/Export-an-iTunes-Playlist)
3. Login to your spotify with the link below
4. Upload the .xml file
5. Name your playlist
6. Double check your playlist (please note some songs may be missing this isn't perfect)
7. Click the button to create a playlist on Spotify
