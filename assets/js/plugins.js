const { ipcRenderer } = require("electron");
const Axios = require("axios");
const cc = require("../assets/json/Cryptocurrencies.json");
const Store = require("electron-store");
const store = new Store();
let search_bar = document.getElementById("search_bar");
let results = document.getElementById("results");
let CoinsCardsArr = [];
var zIndex = 1000000;
var loading = document.createElement("img");
var setIntervalId;

// If First Time :: create `coins` array in localStorage
if (
  localStorage.getItem("coins") == "" ||
  localStorage.getItem("coins") == null ||
  localStorage.getItem("coins") == "[]"
) {
  localStorage.setItem("coins", JSON.stringify(["BTC"]));
}

// Show Info Window
const Info = () => {
  ipcRenderer.send("asynchronous-message", "show-info");
};

// UNUSED ::
const getCryptos = () => {
  return new Promise((resolve, reject) => {
    Axios.get(
      `https://api.nomics.com/v1/prices?key=${store.get("token")}&format=json`
    )
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

function Hide() {
  ipcRenderer.send("asynchronous-message", "hide");
}

// Start ==== Online Offline Listeners ====
window.addEventListener("online", () => {
  loading.style.visibility = "hidden";
  loading.style.opacity = 0;
  document.getElementsByClassName("online-offline")[0].src =
    "../assets/images/online.gif";
  setTimeout(() => {
    loading.style.display = "none";
    RenderCoins(true);
  }, 1000);
});

window.addEventListener("offline", () => {
  clearInterval(setIntervalId);
  CreateLoading();
  document.getElementsByClassName("online-offline")[0].src =
    "../assets/images/offline.gif";
});

// Start ==== Search Bar Get Suggestions ====
search_bar.addEventListener("keyup", function (e) {
  let input = search_bar.value;
  let suggestions = cc
    .filter(function (el) {
      return el.toLowerCase().startsWith(input.toLowerCase());
    })
    .slice(0, 5);
  results.innerHTML = "";
  suggestions.forEach(function (suggestion) {
    let li = document.createElement("li");
    results.appendChild(li);
    li.appendChild(document.createElement("span")).innerHTML = suggestion;
  });
  if (suggestions.length == 0) {
    results.innerHTML = "<li><span>No Results Found ! ????</span></li>";
  }
});

search_bar.addEventListener("keyup", function (e) {
  if (e.target.value == "") {
    results.style.display = "none";
  } else {
    results.style.display = "block";
  }
});

results.addEventListener(
  "click",
  (e) => {
    search_bar.value = "";
    results.style.display = "none";
    SaveCoinToLocalStorage(e.target.innerText);
  },
  false
);

const SaveCoinToLocalStorage = (coin) => {
  // check if coin encluded GG word
  if (coin.includes("No Results Found") !== true) {
    let coins = JSON.parse(localStorage.getItem("coins")) || [];
    if (coins.includes(coin) !== true) {
      coins.push(coin);
      localStorage.setItem("coins", JSON.stringify(coins));
      GetCoinsData(coin)
        .then((res) => {
          res.forEach((coin) => {
            var last_card = document.getElementById("cc-cards").lastChild;
            if (last_card !== null || last_card !== undefined) {
              last_card.style.marginBottom = "10px";
            }
            createNewCard(coin, true);
          });
        })
        .catch((err) => console.log(err));
    }
  }
};

const RemoveCoinToLocalStorage = (coin) => {
  let coins = JSON.parse(localStorage.getItem("coins")) || [];
  if (coins.length !== 1) {
    coins.splice(coins.indexOf(coin), 1);
    localStorage.setItem("coins", JSON.stringify(coins));
    document.querySelector(`[data-ct="${coin}"]`).remove();
  }
};

const GetCoinsData = (coin = null) => {
  let coins = JSON.parse(localStorage.getItem("coins"));
  let URL;
  if (coin !== null) {
    URL = `https://api.nomics.com/v1/currencies/ticker?key=${store.get(
      "token"
    )}&ids=${coin}&interval=1d,30d&convert=USD`;
  } else {
    URL = `https://api.nomics.com/v1/currencies/ticker?key=${store.get(
      "token"
    )}&ids=${coins.join(",")}&interval=1d,30d&convert=USD&per-page=100&page=1`;
  }

  return new Promise((resolve, reject) => {
    if (coins.length == 0) {
      return resolve([]);
    }
    Axios.get(URL)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const RenderCoins = (clean) => {
  if (clean === true) {
    document.getElementById("cc-cards").innerHTML = "";
  }
  GetCoinsData()
    .then((res) => {
      res.forEach((coin) => {
        if (res.length > 0) {
          createNewCard(coin, res[res.length - 1] === coin);
        }
      });
    })
    .then(() => RenderPricesLive());
};
RenderCoins();

const RenderPricesLive = () => {
  setIntervalId = setInterval(() => {
    console.log("rendering");
    GetCoinsData()
      .then((res) => {
        res.forEach((coin) => {
          let card = document.querySelector(`[data-ct="${coin.currency}"]`);
          card_qs = card.querySelector(".price");
          if (card_qs !== null) {
            card_qs.innerHTML = "$" + coin.price;
          } else {
            console.log("error");
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, 2000);
};

const createNewCard = (coin, isLast = false) => {
  var price_change = 0;
  try {
    price_change = coin["1d"].price_change;
  } catch (err) {
    price_change = coin["30d"].price_change;
  }
  var exchange = (price_change / coin.price) * 100; // (837.86729941/62349.88277057)*100
  var card = document.createElement("div");
  var Price = document.createElement("div");
  var Img = document.createElement("img");
  var RemoveBtn = document.createElement("img");
  var ExCh = document.createElement("div");
  card.className = "cc-card";

  // Exchange
  ExCh.className = "exchange-price";
  if (exchange > 0) {
    ExCh.classList.add("positive");
  } else {
    ExCh.classList.add("negative");
  }
  ExCh.innerText = exchange.toFixed(2) + "%";
  card.appendChild(ExCh);
  // RemoveBtn
  RemoveBtn.className = "remove-btn";
  RemoveBtn.src = "../assets/images/remove-p.png";
  RemoveBtn.setAttribute("data-name", coin.currency);
  RemoveBtn.onclick = (e) => {
    RemoveCoinToLocalStorage(e.target.getAttribute("data-name"));
  };
  RemoveBtn.setAttribute("title", "Delete");
  // IMG coin
  Img.className = "icon";
  Img.src = coin.logo_url
    ? coin.logo_url
    : "https://img.icons8.com/material-two-tone/24/000000/error--v2.png";
  card.appendChild(Img);
  // Price
  Price.className = "price";
  Price.innerHTML = "$" + coin.price;
  card.appendChild(Price);
  // Set Z-index
  zIndex -= 1;
  card.style.zIndex = zIndex - 1;
  // Done
  results.appendChild(card);
  card.appendChild(RemoveBtn);
  if (isLast) {
    card.style.marginBottom = "125px";
  }
  card.setAttribute("data-ct", coin.currency);
  card.setAttribute("data-tooltip", coin.name);
  document.getElementById("cc-cards").appendChild(card);
};

const CreateLoading = () => {
  loading.className = "loading";
  loading.src = "../assets/images/loading_tran.svg";
  loading.style.width = "100px";
  loading.style.visibility = "visible";
  loading.style.opacity = 1;
  loading.style.display = "block";
  document.getElementById("cc-cards").prepend(loading);
};
