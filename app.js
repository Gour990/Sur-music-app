const audio = document.getElementById('audio');
const audioInput = document.getElementById('audioInput');
const state = { tracks: [], currentId: null, playing: false, shuffle: false, repeat: false, history: [], historyIndex: -1, objectUrls: new Map() };
const $ = id => document.getElementById(id);
const demoTracks = [
  {id:'demo-1', title:'Blue Hour', artist:'SUR Sessions', album:'Midnight Notes', duration:'—', demo:true, cover:'c1'},
  {id:'demo-2', title:'Soft Signals', artist:'SUR Sessions', album:'Quiet Frequencies', duration:'—', demo:true, cover:'c2'},
  {id:'demo-3', title:'Afterglow', artist:'SUR Sessions', album:'The Blue Collection', duration:'—', demo:true, cover:'c3'},
  {id:'demo-4', title:'Silver Lines', artist:'SUR Sessions', album:'Nocturne', duration:'—', demo:true, cover:'c4'}
];
function allTracks(){ return [...demoTracks, ...state.tracks]; }
function current(){ return allTracks().find(t=>t.id===state.currentId); }
function toast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2300); }
function formatTime(seconds){ if(!Number.isFinite(seconds)) return '0:00'; const m=Math.floor(seconds/60), s=Math.floor(seconds%60); return `${m}:${String(s).padStart(2,'0')}`; }
function safeText(value){ return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function isLiked(id){ try{return JSON.parse(localStorage.getItem('sur-liked')||'[]').includes(id)}catch{return false} }
function toggleLike(id){ let likes=[]; try{likes=JSON.parse(localStorage.getItem('sur-liked')||'[]')}catch{}; likes=likes.includes(id)?likes.filter(x=>x!==id):[...likes,id]; localStorage.setItem('sur-liked',JSON.stringify(likes)); renderAll(); if(id===state.currentId) updatePlayerLike(); }
function trackRow(track){ const liked=isLiked(track.id); return `<div class="track-row"><div class="track-cover ${track.cover||''}">${track.artwork?`<img src="${track.artwork}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:'♫'}</div><div class="track-info"><b>${safeText(track.title)}</b><span>${safeText(track.artist)}</span></div><div class="track-album">${safeText(track.album||'Your files')}</div><span class="track-duration">${safeText(track.duration||'—')}</span><div style="display:flex;align-items:center;gap:7px"><button class="track-play" data-play="${safeText(track.id)}" aria-label="Play ${safeText(track.title)}">▶</button><button class="like-btn ${liked?'liked':''}" data-like="${safeText(track.id)}" aria-label="Like ${safeText(track.title)}">${liked?'♥':'♡'}</button></div></div>`; }
function renderList(id,tracks,emptyId){ $(id).innerHTML=tracks.map(trackRow).join(''); if(emptyId) $(emptyId).classList.toggle('hidden',tracks.length>0); }
function renderAll(){ renderList('homeTrackList',allTracks()); renderSearch(); renderList('libraryTrackList',state.tracks,'libraryEmpty'); const liked=allTracks().filter(t=>isLiked(t.id)); renderList('likedTrackList',liked,'likedEmpty'); $('libraryCount').textContent=state.tracks.length; $('likedCount').textContent=liked.length; $('likedSubtitle').textContent=`${liked.length} track${liked.length===1?'':'s'} saved`; }
function renderSearch(){ const q=($('pageSearch').value||$('globalSearch').value||'').toLowerCase().trim(); const tracks=allTracks().filter(t=>`${t.title} ${t.artist} ${t.album||''}`.toLowerCase().includes(q)); renderList('searchTrackList',tracks,'searchEmpty'); }
function switchPage(page){ document.querySelectorAll('.page').forEach(p=>p.classList.remove('active-page')); const target=$(page+'Page'); if(target) target.classList.add('active-page'); document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); if(page==='search') $('pageSearch').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); }
function updatePlayerLike(){ const c=current(); $('playerLike').textContent=c&&isLiked(c.id)?'♥':'♡'; $('playerLike').classList.toggle('liked',!!c&&isLiked(c.id)); }
function updatePlayer(){ const c=current(); if(!c)return; $('nowTitle').textContent=c.title; $('nowArtist').textContent=c.artist; $('miniCover').innerHTML=c.artwork?`<img src="${c.artwork}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:'♫'; updatePlayerLike(); }
function selectTrack(id,autoplay=true){ const t=allTracks().find(x=>x.id===id); if(!t)return; state.currentId=id; updatePlayer(); if(t.demo){audio.pause();audio.removeAttribute('src');$('playBtn').textContent='▶';state.playing=false;toast('Demo track preview — add an audio file to play music.');$('duration').textContent='0:00';$('currentTime').textContent='0:00';$('progress').value=0;return;} audio.src=state.objectUrls.get(id); audio.load(); if(autoplay) audio.play().then(()=>{state.playing=true;$('playBtn').textContent='Ⅱ'}).catch(()=>toast('Tap play to start this track.')); state.history.push(id);state.historyIndex=state.history.length-1; }
function togglePlay(){ const c=current(); if(!c){ if(state.tracks.length)selectTrack(state.tracks[0].id); else {toast('Add an audio file to start listening.');$('audioInput').click()} return; } if(c.demo){toast('This is a demo listing. Add your own audio file to play.');return;} if(audio.paused){audio.play().then(()=>{state.playing=true;$('playBtn').textContent='Ⅱ'}).catch(()=>toast('Could not play this audio file.'));}else{audio.pause();state.playing=false;$('playBtn').textContent='▶';} }
function nextTrack(){ const tracks=allTracks().filter(t=>!t.demo); if(!tracks.length){toast('Add audio files to build your queue.');return;} let index=tracks.findIndex(t=>t.id===state.currentId); if(state.shuffle) index=Math.floor(Math.random()*tracks.length); else index=(index+1+tracks.length)%tracks.length; selectTrack(tracks[index].id); }
function previousTrack(){ if(audio.currentTime>3){audio.currentTime=0;return;} const tracks=allTracks().filter(t=>!t.demo); let index=tracks.findIndex(t=>t.id===state.currentId); if(index<0)index=0; index=(index-1+tracks.length)%tracks.length; if(tracks[index])selectTrack(tracks[index].id); }
function importFiles(files){ [...files].filter(f=>f.type.startsWith('audio/')).forEach(file=>{const id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const url=URL.createObjectURL(file);state.objectUrls.set(id,url);state.tracks.push({id,title:file.name.replace(/\.[^.]+$/,''),artist:'Local audio',album:'Your files',duration:'—',fileName:file.name});}); renderAll(); if(files.length)toast(`${files.length} file(s) added to your library.`); }
function bindEvents(){
 document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.page)));
 document.addEventListener('click',e=>{const play=e.target.closest('[data-play]');const like=e.target.closest('[data-like]');if(play)selectTrack(play.dataset.play);if(like)toggleLike(like.dataset.like);});
 ['uploadBannerBtn','uploadSearchBtn','uploadLibraryBtn'].forEach(id=>$(id).addEventListener('click',()=>$('audioInput').click()));
 $('audioInput').addEventListener('change',e=>{importFiles(e.target.files);e.target.value='';});
 $('playBtn').addEventListener('click',togglePlay);$('nextBtn').addEventListener('click',nextTrack);$('prevBtn').addEventListener('click',previousTrack);
 $('playerLike').addEventListener('click',()=>{if(current())toggleLike(current().id);});
 $('shuffleBtn').addEventListener('click',()=>{state.shuffle=!state.shuffle;$('shuffleBtn').classList.toggle('enabled',state.shuffle);toast(state.shuffle?'Shuffle on':'Shuffle off');});
 $('repeatBtn').addEventListener('click',()=>{state.repeat=!state.repeat;$('repeatBtn').classList.toggle('enabled',state.repeat);toast(state.repeat?'Repeat current track on':'Repeat off');});
 $('progress').addEventListener('input',e=>{if(Number.isFinite(audio.duration))audio.currentTime=(e.target.value/100)*audio.duration;});
 $('volume').addEventListener('input',e=>audio.volume=Number(e.target.value));
 audio.volume=.8; audio.addEventListener('loadedmetadata',()=>{$('duration').textContent=formatTime(audio.duration);});
 audio.addEventListener('timeupdate',()=>{if(Number.isFinite(audio.duration)){$('progress').value=(audio.currentTime/audio.duration)*100;$('currentTime').textContent=formatTime(audio.currentTime);}});
 audio.addEventListener('play',()=>{$('playBtn').textContent='Ⅱ';state.playing=true;});
 audio.addEventListener('pause',()=>{$('playBtn').textContent='▶';state.playing=false;});
 audio.addEventListener('ended',()=>{if(state.repeat){audio.currentTime=0;audio.play()}else nextTrack()});
 $('globalSearch').addEventListener('input',()=>{switchPage('search');$('pageSearch').value=$('globalSearch').value;renderSearch();});
 $('pageSearch').addEventListener('input',renderSearch);
 $('exploreBtn').addEventListener('click',()=>switchPage('search'));
 $('queueBtn').addEventListener('click',()=>switchPage('library'));
 $('profileBtn').addEventListener('click',()=>switchPage('profile'));
 document.querySelectorAll('[data-mood]').forEach(b=>b.addEventListener('click',()=>{switchPage('search');$('pageSearch').value=b.dataset.mood;renderSearch();toast(`${b.dataset.mood} mood selected`);}));
 $('backBtn').addEventListener('click',()=>switchPage('home'));$('forwardBtn').addEventListener('click',()=>switchPage('library'));
}
bindEvents();renderAll();
