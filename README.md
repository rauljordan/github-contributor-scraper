# Github Contributor Fetcher

Clone the repository

```
git clone https://github.com/rauljordan/github-contributors && cd github-contributors
```

Install the dependencies:

```
npm install -g yarn
yarn install
```

Run the tool, by passing in a github repository url and select the path to the output csv files:

```
npm run build && npm start --repo https://github.com/paritytech/parity-ethereum
```