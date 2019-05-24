import rp, { RequestPromiseOptions } from "request-promise-native";
import env from "dotenv";

env.config();

class ScraperService {
  async fetchContributors(url: string): Promise<Array<string>> {
    const _include_headers = (body: any, response: any) => {
      return {headers: response.headers, data: body};
    };

    const opts: RequestPromiseOptions = {
      qs: {
        access_token: process.env.GITHUB_API_KEY,
        since: "2019-01-01",
        until: "2019-05-04",
      },
      headers: {
          "User-Agent": "Request-Promise",
      },
      json: true, // Automatically parses the JSON string in the response
      transform: _include_headers,
    };
    const res = await rp(url, opts);
    console.log(res.headers);
    // TODO: Use the header paginations to go through each month, logging the necessary data to CSV format
    return res.data.map((c: any) => {
      return {
        date: c.commit.author.date,
        url: c.author.html_url,
      };
    });
  }
}

const main = () => {
  const s = new ScraperService();
  s.fetchContributors("https://api.github.com/repos/prysmaticlabs/prysm/commits")
    .then((res: any) => {
      console.log(res);
      console.log(res.length);
    });
};

main();
