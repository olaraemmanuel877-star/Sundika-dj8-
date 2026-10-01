const $=id=>document.getElementById(id);
const decks={
 A:{audio:$('audioA'),file:$('fileA'),play:$('playA'),pause:$('pauseA'),cue:$('cueA'),jog:$('jogA'),pitch:$('pitchA'),high:$('aHigh'),mid:$('aMid'),low:$('aLow'),bpm:$('bpmA'),time:$('timeA'),wave:$('waveA'),wave2:$('waveA2'),color:'#3f91ff',src:null,nodes:null},
 B:{audio:$('audioB'),file:$('fileB'),play:$('playB'),pause:$('pauseB'),cue:$('cueB'),jog:$('jogB'),pitch:$('pitchB'),high:$('bHigh'),mid:$('bMid'),low:$('bLow'),bpm:$('bpmB'),time:$('timeB'),wave:$('waveB'),wave2:$('waveB2'),color:'#ff8c24',src:null,nodes:null}
};
const AC=new (window.AudioContext||window.webkitAudioContext)();
const master=AC.createGain(); master.gain.value=.85;
const analyser=AC.createAnalyser(); analyser.fftSize=256;
const recordDest=AC.createMediaStreamDestination();
master.connect(analyser); analyser.connect(AC.destination); master.connect(recordDest);
let recorder,recorded=[];
function ensure(d){
 if(d.nodes)return;
 d.src=AC.createMediaElementSource(d.audio);
 const hi=AC.createBiquadFilter(),mid=AC.createBiquadFilter(),lo=AC.createBiquadFilter(),gain=AC.createGain();
 hi.type='highshelf';hi.frequency.value=3200;mid.type='peaking';mid.frequency.value=1000;mid.Q.value=1;lo.type='lowshelf';lo.frequency.value=250;
 d.src.connect(lo).connect(mid).connect(hi).connect(gain).connect(master);
 d.nodes={hi,mid,lo,gain};
}
function setEq(d){if(!d.nodes)return;d.nodes.hi.gain.value=+d.high.value;d.nodes.mid.gain.value=+d.mid.value;d.nodes.lo.gain.value=+d.low.value}
function fmt(s){s=Math.max(0,s|0);return String((s/60)|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1300)}
async function loadDeck(d){
 const f=d.file.files[0]; if(!f)return;
 ensure(d); d.audio.src=URL.createObjectURL(f); d.audio.load();
 d.audio.playbackRate=1; 
 const buf=await f.arrayBuffer(); try{const decoded=await AC.decodeAudioData(buf.slice(0)); drawWave(d,decoded)}catch(e){}
 addTrack(f.name,d);
 toast('Loaded '+f.name);
}
function addTrack(name,d){const row=document.createElement('div');row.className='track';row.textContent=(d===decks.A?'A • ':'B • ')+name;$('tracks').prepend(row)}
function drawWave(d,b){
 const canvases=[d.wave,d.wave2]; canvases.forEach((c,idx)=>{
  const x=c.getContext('2d'),w=c.width=c.clientWidth*devicePixelRatio,h=c.height=c.clientHeight*devicePixelRatio;
  x.clearRect(0,0,w,h);x.strokeStyle=d.color;x.lineWidth=1.5*devicePixelRatio;x.beginPath();
  const data=b.getChannelData(0), step=Math.max(1,Math.floor(data.length/w)), mid=h/2;
  for(let i=0;i<w;i++){let max=0;for(let j=0;j<step;j++){const v=Math.abs(data[Math.min(data.length-1,i*step+j)]);if(v>max)max=v}const amp=max*(idx?1:.75)*mid*.9;x.moveTo(i,mid-amp);x.lineTo(i,mid+amp)}x.stroke();
 });
}
function bind(d){
 d.file.onchange=()=>loadDeck(d);
 d.play.onclick=async()=>{ensure(d);await AC.resume();d.audio.play();d.gainCross=true};
 d.pause.onclick=()=>d.audio.pause();
 d.cue.onclick=()=>{d.audio.currentTime=0;if(d.audio.paused){AC.resume();d.audio.play()}};
 [d.high,d.mid,d.low].forEach(e=>e.oninput=()=>setEq(d));
 d.pitch.oninput=()=>d.audio.playbackRate=1+(+d.pitch.value/100);
 d.audio.ontimeupdate=()=>{d.time.textContent=fmt(d.audio.currentTime)};
}
bind(decks.A);bind(decks.B);
$('cross').oninput=()=>{const v=+$('cross').value; const a=Math.cos((v+1)*Math.PI/4), b=Math.cos((1-v)*Math.PI/4);[decks.A,decks.B].forEach(d=>ensure(d));decks.A.nodes.gain.gain.value=a;decks.B.nodes.gain.gain.value=b};
$('master').oninput=()=>master.gain.value=+$('master').value;
let loopTimer=null;
$('loopBtn').onclick=()=>{const d=decks.A.audio.currentTime?decks.A:decks.B; const start=d.audio.currentTime;const end=start+4;clearInterval(loopTimer);loopTimer=setInterval(()=>{if(d.audio.currentTime>=end)d.audio.currentTime=start},40);toast('4-beat loop active')};
$('fxBtn').onclick=()=>toast('FX panel: Echo / Reverb ready for expansion');
$('cueBtn').onclick=()=>{decks.A.audio.pause();decks.B.audio.pause();toast('Master CUE')};
$('recBtn').onclick=()=>{
 if(!recorder){recorded=[];recorder=new MediaRecorder(recordDest.stream);recorder.ondataavailable=e=>recorded.push(e.data);recorder.onstop=()=>{const b=new Blob(recorded,{type:'audio/webm'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Sundika_DJ8Pro_Mix.webm';a.click();toast('Recording saved');recorder=null};recorder.start();$('recBtn').textContent='■ STOP';toast('Recording started')}
 else{recorder.stop();$('recBtn').textContent='● RECORD'}
};
for(let i=1;i<=18;i++){const b=document.createElement('button');b.textContent=i;b.onclick=()=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=120+i*30;g.gain.setValueAtTime(.0001,AC.currentTime);g.gain.exponentialRampToValueAtTime(.25,AC.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.35);o.connect(g).connect(master);o.start();o.stop(AC.currentTime+.36)};$('pads').appendChild(b)}
function jogBind(d){
 let down=false,last=0;
 d.jog.addEventListener('pointerdown',e=>{down=true;last=e.clientX;e.preventDefault();d.jog.classList.add('active');ensure(d)});
 window.addEventListener('pointerup',()=>{down=false;d.jog.classList.remove('active')});
 window.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-last;last=e.clientX;d.audio.currentTime=Math.max(0,Math.min(d.audio.duration||1,d.audio.currentTime+dx*.035))});
}
jogBind(decks.A);jogBind(decks.B);
setInterval(()=>{const data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data);const avg=data.reduce((a,b)=>a+b,0)/data.length;const h=Math.min(100,avg/2.55);$('meterL').style.height=h+'%';$('meterR').style.height=Math.max(4,h*.9)+'%'},80);
window.addEventListener('resize',()=>document.querySelectorAll('canvas').forEach(c=>{}));
toast('Sundika DJ8 Pro ready');
