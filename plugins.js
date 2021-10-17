const { ipcRenderer } = require("electron");
const Axios = require("axios");
const cc = require("./Cryptocurrencies.json");
let search_bar = document.getElementById("search_bar");
let results = document.getElementById("results");
let CoinsCardsArr = [];

if (localStorage.getItem("coins") == null) {
  localStorage.setItem("coins", JSON.stringify([]));
}
// UNUSED ::
const getCryptos = () => {
  return new Promise((resolve, reject) => {
    Axios.get(
      "https://api.nomics.com/v1/prices?key=e6215948d47c8b6f2b9355c18089f0c1e8f49efb&format=json"
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

const GetSuggestions = () => {
  var ul = results;
  search_bar.addEventListener("keyup", function (e) {
    let input = search_bar.value;
    let suggestions = cc
      .filter(function (el) {
        return el.toLowerCase().startsWith(input.toLowerCase());
      })
      .slice(0, 5);
    ul.innerHTML = "";
    suggestions.forEach(function (suggestion) {
      let li = document.createElement("li");
      ul.appendChild(li);
      li.appendChild(document.createElement("span")).innerHTML = suggestion;
    });
    if (suggestions.length == 0) {
      ul.innerHTML = "<li><span>No Results Found ! 😤</span></li>";
    }
  });
};
GetSuggestions();

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
  let coins = JSON.parse(localStorage.getItem("coins")) || [];
  coins.push(coin);
  localStorage.setItem("coins", JSON.stringify(coins));
  RenderCoins(true);
};

const RemoveCoinToLocalStorage = (coin) => {
  let coins = JSON.parse(localStorage.getItem("coins")) || [];
  coins.splice(coins.indexOf(coin), 1);
  localStorage.setItem("coins", JSON.stringify(coins));
  RenderCoins(true);
};

const GetCoinsData = () => {
  let coins = JSON.parse(localStorage.getItem("coins"));

  let URL = `https://api.nomics.com/v1/currencies/ticker?key=e6215948d47c8b6f2b9355c18089f0c1e8f49efb&ids=${coins.join(
    ","
  )}&interval=1d,30d&convert=USD&per-page=100&page=1`;
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
      var zIndex = 1000000;
      res.forEach((coin) => {
        var card = document.createElement("div");
        var Price = document.createElement("div");
        var Img = document.createElement("img");
        var RemoveBtn = document.createElement("img");
        card.className = "cc-card";
        // RemoveBtn
        RemoveBtn.className = "remove-btn";
        RemoveBtn.src = "./assets/remove-p.png";
        RemoveBtn.setAttribute("data-name", coin.currency);
        RemoveBtn.onclick = (e) => {
          RemoveCoinToLocalStorage(e.target.getAttribute("data-name"));
        };
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
        if (res[res.length - 1] === coin) {
          card.style.marginBottom = "50px";
        }
        card.setAttribute("data-ct", coin.currency);
        document.getElementById("cc-cards").appendChild(card);
      });
    })
    .then(() => RenderPricesLive());
};
RenderCoins();

const RenderPricesLive = () => {
  setInterval(() => {
    console.log("rendering");
    GetCoinsData()
      .then((res) => {
        res.forEach((coin) => {
          let card = document.querySelector(
            `[data-ct="${coin.currency}"]`
          );
          card.querySelector(".price").innerHTML = "$" + coin.price;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, 1000);
};
