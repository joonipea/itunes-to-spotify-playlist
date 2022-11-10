import React, {useState, useEffect} from 'react';
import { createRoot } from 'react-dom/client';
import SpotifyWebApi from 'spotify-web-api-node';
import SpotifyWebApiServer from 'spotify-web-api-node/src/server-methods';
import XMLParser from './models/XMLParser';
import Track from './models/Track';


(SpotifyWebApi as unknown as { _addMethods: (fncs: unknown) => void })._addMethods(SpotifyWebApiServer);
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.REACT_APP_CLIENT_ID,
    clientSecret: process.env.REACT_APP_CLIENT_SECRET,
    redirectUri: process.env.REACT_APP_REDIRECT_URI
});

var scopes = ['user-read-private', 'user-read-email', 'playlist-modify-private', 'playlist-modify-public', 'user-library-modify', 'user-library-read'],
state = 'some-state-of-my-choice';

var authorizeURL = spotifyApi.createAuthorizeURL(
scopes,
state
);
export default function App() {
    const [token, setToken]: any = useState(null);
    const [user, setUser]: any = useState(null);
    const [playlist, setPlaylist]: any = useState([]);
    const [playlistName, setPlaylistName]: any = useState('');
    let tracklist: any = [];
    let spotifyTrackURIs: any = [];
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            spotifyApi.authorizationCodeGrant(code).then(
                function(data) {
                    console.log('The token expires in ' + data.body['expires_in']);
                    console.log('The access token is ' + data.body['access_token']);
                    console.log('The refresh token is ' + data.body['refresh_token']);
                    spotifyApi.setAccessToken(data.body['access_token']);
                    spotifyApi.setRefreshToken(data.body['refresh_token']);
                    setToken(data.body['access_token']);
                },
                function(err) {
                    console.log('Something went wrong!', err);
                }
            );
        }
    }, []);
    useEffect(() => {

        if (token !== null && typeof token === 'string') {
            
            spotifyApi.setAccessToken(token);
            spotifyApi.getMe()
                .then((data) => {
                    console.log('Some information about the authenticated user', data.body);
                    setUser(data.body);
                }, (err) => {
                    console.log('Something went wrong!', err);
                });
        }
    }, [token]);
    

    console.log(token);
    const handleFile = (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (text) {
                console.log(text);
                var parser = new XMLParser();
                parser.parse(text, (err, result) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log(parser);
                        parser.getTracks();

                    } 
                });
                parser._tracks.forEach((track: Track) => {
                    let string = track.toString();
                    console.log(track.toString());
                    tracklist.push(string);
                    setPlaylist(tracklist);
                });

                
            }
        };
        reader.readAsText(file);
    };
    const submitPlaylist = async () => {
        if (playlist.length > 0) {
            await getSpotifyURI();
            spotifyApi.createPlaylist(playlistName, { 'public': true })
            .then( async (data) => {
                console.log(data.body);
                let playlistId = data.body.id;

                const chunkSize = 99;
                const chunks = spotifyTrackURIs.reverse().reduce((resultArray, item, index) => {
                    const chunkIndex = Math.floor(index/chunkSize);
                    if(!resultArray[chunkIndex]) {
                        resultArray[chunkIndex] = [];
                    }
                    resultArray[chunkIndex].push(item);
                    return resultArray;
                }, []);

                for (const chunk of chunks) {
                    await spotifyApi.addTracksToPlaylist(playlistId, chunk)
                    .then( (data) => {
                        console.log(data.body);
                    }, (err) => {
                        console.log(err);
                    });
                };
                for (const chunk of chunks) {
                    await spotifyApi.addToMySavedTracks(chunk)
                    .then( (data) => {
                        console.log(data.body);
                    }, (err) => {
                        console.log(err);
                    });
                };
            });
        }
        else {
            console.log('No tracks to add');
        }
    };

    const getSpotifyURI = () => {
        return new Promise((resolve) => {
        playlist.forEach((track: string) => {
            spotifyApi.searchTracks(decodeURIComponent(track)).then((data) => {
                console.log(data.body);
                if(data?.body?.tracks?.items[0].uri){
                spotifyTrackURIs.push(data?.body?.tracks?.items[0].uri);
                }else{
                    console.log('no uri for ' + decodeURIComponent(track));
                }
            }, (err) => {
                console.log(err);
            });
        });
        resolve(spotifyTrackURIs);
        })

    };


    return token === null ? (
        <div>
            <h1>Itunes/Apple Music Playlist to Spotify Playlist</h1>
            <h3>Steps:</h3>
            <ol>
                <li>Save a copy of a single playlist or use it in Music on another computer: Select a playlist in the sidebar, choose File / Library / Export Playlist, then click the Format pop-up menu and choose XML.</li>
                <li>Login to your spotify with the link below</li>
                <li>Upload the .xml file</li>
                <li>Name your playlist</li>
                <li>Double check your playlist (please note some songs may be missing this isn't perfect)</li>
                <li>Click the button to create a playlist on Spotify</li>
            </ol>
            <a href={authorizeURL}>Login with Spotify</a>
            <p>If you'd like to contribute to this project reachout to june@joonipea.com or check https://github.com/joonipea</p>
        </div>
    ) : (
        <div>
            <h1>Logged in</h1>
            <img src={user?.images[0].url} alt="user image" />
            <h2>{user?.display_name}</h2>
            <h3>{user?.email}</h3>
            <input type="file" accept='.xml' onChange={handleFile}></input>
            <input type="text" value={playlistName} onChange={e => setPlaylistName(e.target.value)}></input>
            <button onClick={submitPlaylist}>Submit</button>
            <div>
                {playlist.map((track: any) => (
                    <div>{decodeURIComponent(track)}</div>
                ))}
            </div>
            <p>If you'd like to contribute to this project reachout to june@joonipea.com or check https://github.com/joonipea</p>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<App />);