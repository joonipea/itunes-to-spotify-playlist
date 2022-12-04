import React, {useState, useEffect, useRef} from 'react';
import { createRoot } from 'react-dom/client';
import SpotifyWebApi from 'spotify-web-api-node';
import SpotifyWebApiServer from 'spotify-web-api-node/src/server-methods';
import XMLParser from './models/XMLParser';
import Track from './models/Track';
import './index.css';


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
    const [problemSongs, setProblemSongs]: any = useState([]);
    const [playlistName, setPlaylistName]: any = useState('');
    const [playlistUrl, setPlaylistUrl]: any = useState('');
    const [addToSaved, setAddToSaved]: any = useState(false);
    const [mode, setMode]: any = useState('');
    const [stepTwo, setStepTwo]: any = useState(false);
    const [loading, setLoading]: any = useState(false);
    const [progress, setProgress]: any = useState(0);
    const [taskName, setTaskName]: any = useState('');
    const [spotifyLink, setSpotifyLink]: any = useState('');
    const [done, setDone]: any = useState(false);
    let tracklist: any = [];
    let problemSongsList: any = [];
    let spotifyTrackURIs: any = [];
    const successDialog = useRef<HTMLDialogElement>(null);
    const isMobile = () => {
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
        return check;
    }
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
            setTaskName('Searching for tracks');
            for await (let track of playlist){
                await (function() {
                    return new Promise<void>((resolve, reject) => {
                        spotifyApi.searchTracks(decodeURIComponent(track)).then((data) => {
                            if (data.body.tracks && data.body.tracks.items.length > 0) {
                                spotifyTrackURIs.push(data.body.tracks.items[0].uri);
                            } else {
                                console.log('no tracks found');
                                console.log(decodeURIComponent(track));
                                problemSongsList.push(track)
                                cntr++;
                            }
                            pos++;
                            setProgress(pos/playlist.length * 100);
                            resolve();
                        }, (err) => {
                            pos++;
                            cntr++;
                            console.log(err);
                            setProgress(pos/playlist.length * 100);
                            reject();
                        });
                    });
                })();
                if (pos == playlist.length) {
                    setProblemSongs(problemSongsList);
                    if (addToSaved) {
                        setTaskName('Adding tracks to library');
                    }else {
                        setTaskName('Adding tracks to playlist');
                    }
                    resolve(setProgress(0));
                }
            };
        });
    };
    const submitPlaylist = async () => {
        setLoading(true);
        await getSpotifyURI();
        console.log(spotifyTrackURIs);
        if (spotifyTrackURIs.length > 0) {
            if (addToSaved) {
                for await (let track of spotifyTrackURIs.reverse()) {
                    await (function() {
                        return new Promise<void>((resolve, reject) => {
                            fetch(`https://api.spotify.com/v1/me/tracks?ids=${track.toString().replaceAll("spotify:track:","").replaceAll(",","%2C")}`,{
                                method: "PUT",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": "Bearer " + token
                                },
                            }).then((data) => {
                                setTimeout(() => {
                                    setProgress(100 - (spotifyTrackURIs.indexOf(track)/spotifyTrackURIs.length * 100));
                                    resolve(console.log(data));
                                }, 500);
                            }, (err) => {
                                setTimeout(() => {
                                    setProgress(100 - (spotifyTrackURIs.indexOf(track)/spotifyTrackURIs.length * 100));
                                    reject(console.log(err));
                                }, 500);
                            });
                        });
                    })();
                    if (spotifyTrackURIs.indexOf(track) == 0) {
                        setProgress(0);
                        setTaskName('Adding tracks to playlist');
                    }
                }
            }
            spotifyApi.createPlaylist(playlistName, { 'public': true, 'description': 'playlist made with: https://itunes-spotify.herokuapp.com/' })
            .then( async (data) => {
                const playlistId = data.body.id;

                const chunkSize = 50; // max limit for tracks is 100
                const chunks = addToSaved ? spotifyTrackURIs.reverse().reduce((resultArray, item, index) => {
                    const chunkIndex = Math.floor(index/chunkSize);
                    if(!resultArray[chunkIndex]) {
                        resultArray[chunkIndex] = [];
                    }
                    resultArray[chunkIndex].push(item);
                    return resultArray;
                }, []) : spotifyTrackURIs.reduce((resultArray, item, index) => {
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
                                    setProgress(chunks.indexOf(chunk)/chunks.length * 100);
                                    resolve(console.log(data.body));
                                }, (err) => {
                                    setProgress(chunks.indexOf(chunk)/chunks.length * 100);
                                    reject(console.log(err));
                                });
                        });
                    })();

                    if (chunks.indexOf(chunk) == chunks.length - 1) {
                        setSpotifyLink(data.body.uri);
                        setLoading(false);
                        setDone(true);
                    }
                };
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
            <h1>Apple Music Playlist to Spotify Playlist</h1>
            <p>
            A free Apple Music/iTunes playlist to Spotify playlist convertor. Keep your favorite tunes cross platform or send a playlist to a friend.
            </p>
            <a href={authorizeURL} className="login-btn"><img src="./Spotify_Icon_RGB_White.png" height="16px" width="16px" style={{marginRight:'8px'}}/>Login with Spotify</a>
            <p>If you'd like to contribute to this project check out the <a href='https://github.com/joonipea/itunes-to-spotify-playlist'>repo on github</a></p>
        </div>
    ) : isMobile() ? (

        playlist.length === 0 ? (
            <div className='step-container'>
                <p>Step 1/3</p>
                <h3>Paste a link to your Apple Music Playlist</h3>
                <input type={'text'} value={playlistUrl} placeholder={'https://music.apple.com/us/playlist...'} onChange={e => setPlaylistUrl(e.target.value)}/>
                <div>
                <input name="saved" type={'checkbox'} checked={addToSaved} onChange={() => setAddToSaved(!addToSaved)}/>
                    <label htmlFor="saved">Would you like to add the songs to your library?</label>
                </div>
                <button onClick={() => getFromURL(playlistUrl)}>Next</button>
                <p>This method is limited to 300 songs. If you'd like more, please login on a desktop</p>
            </div>
        ) : playlist && !stepTwo ? (
            <div className='step-container'>
                <p>Step 2/3</p>
                <h3>Give it a Name</h3>
                <input type={'text'} value={playlistName} placeholder={'Playlist Name'} onChange={e => setPlaylistName(e.target.value)}/>
                <button onClick={() => setStepTwo(true)}>Next</button>
            </div>
        ) : playlist && stepTwo && !loading && !done ? (
                <div className='step-container no-center'>
                    <p>Step 3/3</p>
                    <h3>Everything look good?</h3>
                    <button onClick={submitPlaylist}>Yup!</button>
                    <ol>
                        {playlist.map((song, i) => <li key={i}>{decodeURIComponent(song)}</li>)}
                    </ol>
                    <button onClick={submitPlaylist}>Yup!</button>
                </div>
        ) :  playlist && stepTwo && loading && !done ? (
            <div className='step-container'>
                <h3>{taskName}</h3>
                <p>{progress}</p>
            </div>
        ) :  playlist && stepTwo && done && !loading && problemSongs.length === 0 ? (
            <div className='step-container no-center'>
                <h3>Wooo!</h3>
                <p>Your playlist, {playlistName} is live!</p>
                <a href={spotifyLink}><button>Check it out!</button></a>
                <button onClick={() => window.location.reload()}>Create another playlist</button>
            </div>
        ) : playlist && stepTwo && done && !loading && problemSongs.length !== 0 ? (
            <div className='step-container no-center'>
                <h3>Wooo!</h3>
                <p>Your playlist, {playlistName} is live!</p>
                <a href={spotifyLink}><button>Check it out!</button></a>
                <button onClick={() => window.location.reload()}>Create another playlist</button>
                <p>Unfortunately, we couldn't find these songs:</p>
                <ol>
                    {problemSongs.map((song, i) => <li key={i}>{decodeURIComponent(song)}</li>)}
                </ol>
            </div>
        ) : (
            <div>
                <h1>Something went wrong</h1>
                <p>Try refreshing the page</p>
            </div>
        )
    ) : (
        mode.length === 0 ? (
        <div>
            <h3>Choose a Method</h3>
            <div className='button__container'>
                <button className="button__setting" onClick={() => setMode('url')}>
                    <h3>Use a Playlist Link</h3>
                    <svg viewBox="0 0 24 24" width="96" height="96" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"/></svg>
                    <p><strong>Recommended</strong></p>
                    <p>Click "Share Playlist" and "Copy Link"</p>
                    <p>This method is limited to 300 songs</p>
                </button>
                <button className="button__setting" onClick={() => setMode('xml')}>
                    <h3>Use an XML File</h3>
                    <span className='big-text'>.XML</span>
                    <p>More steps, but you can have up to 10,000 songs per playlist</p>
                </button>
            </div>
        </div>
        ) : mode === 'xml' && playlist.length === 0 ? (
            <div className='step-container'>
                <p>Step 1/3</p>
                <h3>Export Playlist</h3>
                <ol>
                    <li>Open Apple Music/iTunes</li>
                    <li>Select a playlist in the sidebar,</li> 
                    <li>Choose File {">"} Library {">"} Export Playlist,</li> 
                    <li>Then click the Format pop-up menu and choose XML.</li>
                </ol>
                <div>
                <input name="saved" type={'checkbox'} checked={addToSaved} onChange={() => setAddToSaved(!addToSaved)}/>
                    <label htmlFor="saved">Would you like to add the songs to your library?</label>
                </div>
                <input type={'file'} accept='.xml' onChange={handleFile}/>
            </div>
        ) : mode === 'url' && playlist.length === 0 ? (
            <div className='step-container'>
                <p>Step 1/3</p>
                <h3>Paste a link to your Apple Music Playlist</h3>
                <input type={'text'} value={playlistUrl} placeholder={'https://music.apple.com/us/playlist...'} onChange={e => setPlaylistUrl(e.target.value)}/>
                <div>
                <input name="saved" type={'checkbox'} checked={addToSaved} onChange={() => setAddToSaved(!addToSaved)}/>
                    <label htmlFor="saved">Would you like to add the songs to your library?</label>
                </div>
                <button onClick={() => getFromURL(playlistUrl)}>Next</button>
            </div>
        ) : playlist && !stepTwo ? (
            <div className='step-container'>
                <p>Step 2/3</p>
                <h3>Give it a Name</h3>
                <input type={'text'} value={playlistName} placeholder={'Playlist Name'} onChange={e => setPlaylistName(e.target.value)}/>
                <button onClick={() => setStepTwo(true)}>Next</button>
            </div>
        ) : playlist && stepTwo && !loading && !done ? (
                <div className='step-container no-center'>
                    <p>Step 3/3</p>
                    <h3>Everything look good?</h3>
                    <button onClick={submitPlaylist}>Yup!</button>
                    <ol>
                        {playlist.map((song, i) => <li key={i}>{decodeURIComponent(song)}</li>)}
                    </ol>
                    <button onClick={submitPlaylist}>Yup!</button>
                </div>
        ) :  playlist && stepTwo && loading && !done ? (
            <div className='step-container'>
                <h3>{taskName}</h3>
                <p>{progress}</p>
            </div>
        ) :  playlist && stepTwo && done && !loading && problemSongs.length === 0 ? (
            <div className='step-container no-center'>
                <h3>Wooo!</h3>
                <p>Your playlist, {playlistName} is live!</p>
                <a href={spotifyLink}><button>Check it out!</button></a>
                <button onClick={() => window.location.reload()}>Create another playlist</button>
            </div>
        ) : playlist && stepTwo && done && !loading && problemSongs.length !== 0 ? (
            <div className='step-container no-center'>
                <h3>Wooo!</h3>
                <p>Your playlist, {playlistName} is live!</p>
                <a href={spotifyLink}><button>Check it out!</button></a>
                <button onClick={() => window.location.reload()}>Create another playlist</button>
                <p>Unfortunately, we couldn't find these songs:</p>
                <ol>
                    {problemSongs.map((song, i) => <li key={i}>{decodeURIComponent(song)}</li>)}
                </ol>
            </div>
        ) : (
            <div>
                <h1>Something went wrong</h1>
                <p>Try refreshing the page</p>
            </div>
        )
    );
}

createRoot(document.getElementById('root')!).render(<App />);