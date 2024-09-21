// current song
let currentSong = new Audio();

// all songs
let songs = [];

// current album
let currFolder = "";

// Convert the seconds into minutes for song duration
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds =
    remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder; // Set the current folder correctly

  let a = await fetch(`http://127.0.0.1:5500/spotify/songs/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;

  let as = div.getElementsByTagName("a");

  songs = []; // Clear the current songs array

  for (let index = 0; index < as.length; index++) {
    const element = as[index];

    if (element.href.endsWith("mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // Clear the song list before adding new songs
  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = ""; // Clear existing songs

  for (const song of songs) {
    songUL.innerHTML += `
           <li>
              <img src="./music.svg" alt="" class="invert">
              <div class="info">
                <div>${(song.split('.mp3')[0]).replaceAll("%20", " ")}</div>
                <div>Waleed</div>
              </div>
              <div class="playnow">
                <span>Play Now</span>
                <img src="./play.svg" alt="" class="invert">
              </div>
            </li>`;
  }

  // Attach an event listener to each song
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (event) => {
      console.log(e.querySelector(".info").firstElementChild.innerHTML.trim());
      playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
    });
  });

  // Play the first song automatically and activate the controls
  if (songs.length > 0) {
    playMusic(songs[0], true); // Play the first song, but don't auto-play
    document.querySelector("#play").classList.add("active");
    document.querySelector("#previous").classList.add("active");
    document.querySelector("#next").classList.add("active");
  }
}

function playMusic(track, pause = false) {
  currentSong.src = `./songs/${currFolder}/${track}`;
  document.querySelector(".circle").style.left = `0%`;

  if (!pause) {
    currentSong.play();
    document.querySelector("#play").src = "./pause.svg";
  }

  document.querySelector(".songinfo").innerHTML = track.split(".mp3")[0].replaceAll("%20",' ');
}

async function displayAlbums() {
  let a = await fetch(`http://127.0.0.1:5500/spotify/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let array = Array.from(anchors);

  const cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = ""; // Clear existing albums

  for (let index = 0; index < array.length; index++) {
    const e = array[index];

    if (e.href.includes("/songs/")) {
      let folder = e.href.split("/songs/")[1];

      let albumMeta = await fetch(
        `http://127.0.0.1:5500/spotify/songs/${folder}/info.json`
      );
      let response = await albumMeta.json();

      cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="12" />
              <path d="M8 18V6L18 12L8 18Z" fill="black" />
            </svg>
          </div>
          <img src="./songs/${folder}/cover.jpg" alt="" />
          <h2>${response.title}</h2>
          <p>${response.description}</p>
        </div>
      `;
    }
  }

  // Load the songs on clicking the playlist
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async (event) => {
      await getSongs(card.dataset.folder);
    });
  });
}

async function main() {
  await displayAlbums(); // Display all albums

  // Initial setup: Set initial song time and disable controls by not adding the active class
  document.querySelector(".songtime").innerHTML = "0:00 : 0:00";

  // Attach event listeners to control buttons
  document.querySelector("#play").addEventListener("click", (event) => {
    if (document.querySelector("#play").classList.contains("active")) {
      if (currentSong.paused) {
        currentSong.play();
        document.querySelector("#play").src = "./pause.svg";
      } else {
        currentSong.pause();
        document.querySelector("#play").src = "./play.svg";
      }
    }
  });

  currentSong.addEventListener("timeupdate", (event) => {
    document.querySelector(".songtime").innerHTML = `
      ${formatTime(currentSong.currentTime)} : ${formatTime(
      currentSong.duration
    )}
    `;
    document.querySelector(".circle").style.left = `${
      (currentSong.currentTime / currentSong.duration) * 100
    }%`;
  });

  document.querySelector(".seekbar").addEventListener("click", (event) => {
    if (document.querySelector("#play").classList.contains("active")) {
      let percent =
        (event.offsetX / event.target.getBoundingClientRect().width) * 100;
      currentSong.currentTime = (currentSong.duration * percent) / 100;
    }
  });

  // Add event listener to the hamburger
  document.querySelector(".hamburger").addEventListener("click", (event) => {
    document.querySelector(".left").style.left = "0";
  });

  // Add event listener to the close button of hamburger
  document.querySelector(".close").addEventListener("click", (event) => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Add event listener to the previous button
  document.querySelector("#previous").addEventListener("click", (event) => {
    if (document.querySelector("#previous").classList.contains("active")) {
      currentSong.pause();
      let index;
      try {
        index = songs.indexOf(currentSong.src.split("songs/")[1]);
      } catch (error) {
        console.log(error);
      }

      if (index - 1 >= 0) {
        playMusic(songs[index - 1]);
      }
    }
  });

  // Add event listener to the next button
  document.querySelector("#next").addEventListener("click", (event) => {
    if (document.querySelector("#next").classList.contains("active")) {
      currentSong.pause();
      let index;
      try {
        index = songs.indexOf(currentSong.src.split("songs/")[1]);
      } catch (error) {
        console.log(error);
      }

      if (index + 1 < songs.length) {
        playMusic(songs[index + 1]);
      }
    }
  });

  // Add event listener to the volume control
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("input", (event) => {
      if (document.querySelector("#play").classList.contains("active")) {
        console.log(event.target.value / 100);
        currentSong.volume = parseFloat(event.target.value) / 100;
        const e = document.querySelector(".volume>img");
        if (e.src.includes("mute.svg")) {
          e.src = "volume.svg";
          currentSong.muted = false;
        }
      }
    });

  // Add event listener to mute the track
  document.querySelector(".volume>img").addEventListener("click", (event) => {
    if (document.querySelector("#play").classList.contains("active")) {
      if (event.target.src.includes("volume.svg")) {
        event.target.src = "mute.svg";
        currentSong.muted = true;
      } else {
        event.target.src = "volume.svg";
        currentSong.muted = false;
      }
    }
  });
}

main();
