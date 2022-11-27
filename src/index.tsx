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
    const [playlistUrl, setPlaylistUrl]: any = useState('');
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
                        parser.getPlaylists();
                        parser.getTrackOrder();
                        console.log(parser._order);
                        (function(){
                            return new Promise<void>((resolve) => { 
                                parser._tracks.sort((a, b) => parser._order.indexOf(parseInt(a._id)) - parser._order.indexOf(parseInt(b._id)));
                                resolve();
                            });
                        })();
                        console.log(parser);
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
    const getFromURL = (url: string) => {
        return new Promise<void>(async (resolve) => {
            fetch(process.env.REACT_APP_PROXY_URL + url).then((response) => {
                return response.text()
            }).then((html) => {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var sCount = 0;
                var aCount = 0;
                var songsArray: Array<string>  = [];
                var artistsArray: Array<string> = [];
                var songList = doc.querySelectorAll<HTMLElement>('.songs-list-row__song-name')
                songList.forEach((el) => {
                    songsArray.push(el.innerText);
                    sCount++;
                })
                var artistList = doc.querySelectorAll<HTMLElement>('.songs-list__col--secondary')
                artistList.forEach((el) => {
                    artistsArray.push(el.innerText.trim());
                    aCount++;
                })
                if (sCount == songList.length && aCount == artistList.length) {
                    for (let i = 0; i < songsArray.length; i++) {
                        tracklist.push(encodeURIComponent('track:' + songsArray[i].replace(/\ \(.*/g, '') + ' artist:' + artistsArray[i + 1].replace(/\ \& .*/g, '')));
                        setPlaylist(tracklist);
                    }
                    resolve(console.log(playlist));
                }
            });
        });
    };
    const getSpotifyURI = () => {
        return new Promise<void>( async (resolve) => {
            let cntr = 0;
            let pos = 0;
            for await (let track of playlist){
                await (function() {
                    return new Promise<void>((resolve, reject) => {
                        spotifyApi.searchTracks(decodeURIComponent(track)).then((data) => {
                            if (data.body.tracks && data.body.tracks.items.length > 0) {
                                spotifyTrackURIs.push(data.body.tracks.items[0].uri);
                            } else {
                                console.log('no tracks found');
                                console.log(decodeURIComponent(track));
                                cntr++;
                            }
                            pos++;
                            resolve();
                        }, (err) => {
                            pos++;
                            cntr++;
                            console.log(err);
                            reject();
                        });
                    });
                })();
                if (pos == playlist.length) {
                    resolve();
                }
            };
        });
    };
    const submitPlaylist = async () => {
        await getSpotifyURI();
        if (spotifyTrackURIs.length > 0) {
            spotifyApi.createPlaylist(playlistName, { 'public': true, 'description': 'playlist made with: https://itunes-spotify.herokuapp.com/' })
            .then( async (data) => {
                const playlistId = data.body.id;

                const chunkSize = 100; // max limit for tracks is 100
                const chunks = spotifyTrackURIs.reduce((resultArray, item, index) => {
                    const chunkIndex = Math.floor(index/chunkSize);
                    if(!resultArray[chunkIndex]) {
                        resultArray[chunkIndex] = [];
                    }
                    resultArray[chunkIndex].push(item);
                    return resultArray;
                }, []);

                for await (const chunk of chunks) {
                    await (function(){
                        return new Promise<void>((resolve, reject) => {
                                spotifyApi.addTracksToPlaylist(playlistId, chunk)
                                .then( (data) => {
                                    resolve(console.log(data.body));
                                }, (err) => {
                                    reject(console.log(err));
                                });
                        });
                    })();
                    if (chunks.indexOf(chunk) == chunks.length - 1) {
                        if(successDialog.current !== null){
                            successDialog.current.innerHTML += `Your playlist, ${playlistName} was created <a href=${data.body.uri}>here!</a>`;
                            successDialog.current.showModal();
                            successDialog.current.querySelector('button')?.addEventListener('click', () => {
                                successDialog.current?.close();
                            });
        
                        }
                    }
                };

                setPlaylistName('');
                setPlaylist([]);
            });
        }
        else {
            console.log('No tracks to add');
        }
    };

    // check the user agent to see if its mobile or not from detectmobilebrowsers.com
    const mobileAndTabletCheck = () => {
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
        return check;
    };
    return token === null ? (
        <div style={{margin:'auto',width:'fit-content',marginTop:'60px'}}>
            <style>
                {`
                .login-btn {
                    background-color: #1DB954;
                    padding: 10px;
                    border-radius: 20px;
                    color: white;
                    text-decoration: none;
                    display: flex;
                    vertical-align: middle;
                    width: fit-content;
                }
                .login-btn:hover {
                    background-color: #1ED760;
                }
                p, a, li {
                    font-family: 'Montseratt, Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    color: #fff;
                }
                li {
                    margin-bottom: 10px;
                }
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-weight: 400;
                    color: #fff;
                }
                :root {
                    background: conic-gradient(from 180deg at 50% 50%, #151524 0deg, #17171C 73.13deg, #151524 360deg);
                    min-height: 100vh;
                }
                `}
            </style>
            <h1>Apple Music Playlist to Spotify Playlist</h1>
            <p>
            A free Apple Music/iTunes playlist to Spotify playlist convertor. Keep your favorite tunes cross platform or send a playlist to a friend.
            </p>
            <a href={authorizeURL} className="login-btn"><img src="./Spotify_Icon_RGB_White.png" height="16px" width="16px" style={{marginRight:'8px'}}/>Login with Spotify</a>
            <p>If you'd like to contribute to this project reachout to june@joonipea.com or check out the <a href='https://github.com/joonipea/itunes-to-spotify-playlist'>repo on github</a></p>
        </div>
    ) : (
        <div style={{margin:'auto',width:'fit-content'}}>
            <style>
                {`
                .login-btn {
                    background-color: #1DB954;
                    padding: 10px;
                    border-radius: 20px;
                    color: white;
                    text-decoration: none;
                    display: flex;
                    vertical-align: middle;
                    width: fit-content;
                }
                .login-btn:hover {
                    background-color: #1ED760;
                }
                p, a, li {
                    font-family: 'Montseratt, Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    color: #fff;
                }
                li {
                    margin-bottom: 10px;
                }
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-weight: 400;
                    color: #fff;
                }
                :root {
                    background: conic-gradient(from 180deg at 50% 50%, #151524 0deg, #17171C 73.13deg, #151524 360deg);
                    min-height: 100vh;
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
            <input type={'text'} value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)}></input>
            <button onClick={() => getFromURL(playlistUrl)}>Get from URL</button>
            <div>
                <ol>
                {playlist.map((track: any) => (
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