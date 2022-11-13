import React, {useState, useEffect, useRef} from 'react';
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
    const successDialog = useRef<HTMLDialogElement>(null);
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
    
    const handleFile = (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (text) {
                var parser = new XMLParser();
                parser.parse(text, (err, result) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        parser.getTracks();
                    } 
                });
                parser._tracks.forEach((track: Track) => {
                    let string = track.toString();
                    tracklist.push(string);
                    setPlaylist(tracklist);
                });
                
            }
        };
        reader.readAsText(file);
    };
    const getSpotifyURI = () => {
        return new Promise<void>( async (resolve) => {
            let cntr = 0;
            let pos = 0;
            playlist.forEach((track: any) => {
                setTimeout(async () => {
                await spotifyApi.searchTracks(decodeURIComponent(track)).then((data) => {
                    if (data.body.tracks && data.body.tracks.items.length > 0) {
                        spotifyTrackURIs.push(data.body.tracks.items[0].uri);
                    } else {
                        console.log('no tracks found');
                        cntr++;
                    }
                    pos++;
                }, (err) => {
                    pos++;
                    cntr++;
                    console.log(err);
                });
                if (pos == playlist.length) {
                    resolve();
                }
            }, 300 * (pos + 1));
            });
        });
    };
    const submitPlaylist = async () => {
        await getSpotifyURI();
        if (spotifyTrackURIs.length > 0) {
            spotifyApi.createPlaylist(playlistName, { 'public': true, 'description': 'playlist made with: https://itunes-spotify.herokuapp.com/' })
            .then( async (data) => {
                const playlistId = data.body.id;

                const chunkSize = 100; // max limit for tracks is 100
                const chunks = spotifyTrackURIs.reverse().reduce((resultArray, item, index) => {
                    const chunkIndex = Math.floor(index/chunkSize);
                    if(!resultArray[chunkIndex]) {
                        resultArray[chunkIndex] = [];
                    }
                    resultArray[chunkIndex].push(item);
                    return resultArray;
                }, []);

                for (const chunk of chunks) {
                    setTimeout(async () => {
                        await spotifyApi.addTracksToPlaylist(playlistId, chunk)
                        .then( (data) => {
                            console.log(data.body);
                        }, (err) => {
                            console.log(err);
                        });
                    }, 300 * (chunks.indexOf(chunk) + 1));
                };
                if(successDialog.current !== null){
                    successDialog.current.innerHTML += `Your playlist, ${playlistName} was created <a href=${data.body.uri}>here!</a>`;
                    successDialog.current.showModal();
                    successDialog.current.querySelector('button')?.addEventListener('click', () => {
                        successDialog.current?.close();
                    });

                }
                setPlaylistName('');
                setPlaylist([]);
            });
        }
        else {
            console.log('No tracks to add');
        }
    };


    return token === null ? (
        <div style={{margin:'auto',width:'fit-content'}}>
            <style>
                {`
                .login-btn {
                    background-color: #1DB954;
                    padding: 10px;
                    border-radius: 5px;
                    color: white;
                    text-decoration: none;
                }
                .login-btn:hover {
                    background-color: #1ED760;
                }
                p, a, li {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    color: #222;
                }
                li {
                    margin-bottom: 10px;
                }
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-weight: 400;
                    color: #222;
                }
                `}
            </style>
            <h1>iTunes/Apple Music Playlist to Spotify Playlist</h1>
            <h3>Steps:</h3>
            <ol>
                <li>Open iTunes</li>
                <li>Select a playlist in the sidebar</li>
                <li>Choose File / Library / Export Playlist, then click the Format pop-up menu and choose XML. <ul><li><a href="https://www.wikihow.com/Export-an-iTunes-Playlist">If you're running into problems check out this guide</a></li></ul></li>
                <li>Login to your spotify with the link below</li>
                <li>Upload the .xml file</li>
                <li>Name your playlist</li>
                <li>Double check your playlist (please note some songs may be missing this isn't perfect)</li>
                <li>Click the button to create a playlist on Spotify</li>
            </ol>
            <a href={authorizeURL} className="login-btn">Login with Spotify</a>
            <p>If you'd like to contribute to this project reachout to june@joonipea.com or check https://github.com/joonipea</p>
        </div>
    ) : (
        <div style={{margin:'auto',width:'fit-content'}}>
            <style>
                {`
                .login-btn {
                    background-color: #1DB954;
                    padding: 10px;
                    border-radius: 5px;
                    color: white;
                    text-decoration: none;
                }
                .login-btn:hover {
                    background-color: #1ED760;
                }
                p, a, li {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    color: #222;
                }
                li {
                    margin-bottom: 10px;
                }
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-weight: 400;
                    color: #222;
                }
                `}
            </style>
            <h1>Logged in</h1>
            <img src={user?.images[0].url} alt="user image" />
            <h2>{user?.display_name}</h2>
            <h3>{user?.email}</h3>
            <label htmlFor='file'>XML Playlist File</label>
            <input name='file' type="file" accept='.xml' onChange={handleFile}></input>
            <label htmlFor='playlistName'>Playlist Name</label>
            <input name='playlist' type="text" value={playlistName} onChange={e => setPlaylistName(e.target.value)}></input>
            <button onClick={submitPlaylist}>Submit</button>
            <div>
                <ol>
                {playlist.reverse().map((track: any) => (
                    <li>{decodeURIComponent(track)}</li>
                ))}
                </ol>
            </div>
            <dialog ref={successDialog}><button>Close</button></dialog>
            <p>If you'd like to contribute to this project check <a href='https://github.com/joonipea/itunes-to-spotify-playlist'>https://github.com/joonipea/itunes-to-spotify-playlist</a></p>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<App />);