import rp, { RequestPromiseOptions } from "request-promise-native";
import env from "dotenv";
import gh from "parse-github-url";
import { getMonth } from "date-fns";
import { createObjectCsvWriter } from "csv-writer";
import { isEmpty, uniq } from "lodash";

env.config();

class ScraperService {
  async fetchContributors(url: string): Promise<any> {
    const _include_headers = (body: any, response: any) => {
      return {headers: response.headers, data: body};
    };

    const opts: RequestPromiseOptions = {
      qs: {
        access_token: process.env.GITHUB_API_KEY,
        since: "2019-01-01",
      },
      headers: {
          "User-Agent": "Request-Promise",
      },
      json: true, // Automatically parses the JSON string in the response
      transform: _include_headers,
    };
    let res = await rp(url, opts);
    let data = res.data.map((c: any) => {
      if (c.author === null) {
        return;
      }
      return {
        date: c.commit.author.date,
        url: c.author.html_url,
      };
    });

    let pages = res.headers.link.split(",");
    const lastPage = pages[pages.length - 1];
    const lastLink = lastPage.slice(lastPage.indexOf("<") + 1, lastPage.indexOf(">"));
    let nextPage = pages[0];
    let link = nextPage.slice(nextPage.indexOf("<") + 1, nextPage.indexOf(">"));
    while (link !== lastLink) {
      res = await rp(link, {
        headers: {
          "User-Agent": "Request-Promise",
        },
        json: true,
        transform: _include_headers,
      });
      const commits = res.data.map((c: any) => {
        if (c.author === null) {
          return;
        }
        return {
          date: c.commit.author.date,
          url: c.author.html_url,
        };
      });
      data = data.concat(commits);
      pages = res.headers.link.split(",");
      nextPage = pages[0];
      link = nextPage.slice(1, nextPage.indexOf(">"));
      console.log(link);
    }

    const monthlyContributions: any = {};
    const months = data.map((item: any) => {
      if (!isEmpty(item)) {
        return getMonth(item.date);
      }
    });

    const contributors: any = {};
    data.forEach((item: any) => {
      if (!isEmpty(item)) {
        if (!contributors[item.url]) {
          contributors[item.url] = 1;
        } else {
          contributors[item.url] += 1;
        }
      }
    });
    months.forEach((month: number) => {
      monthlyContributions[month] = data.filter((item: any) => {
        if (!isEmpty(item)) {
          return getMonth(item.date) === month;
        }
      });
    });
    const commitOutput: Array<any> = Object.keys(monthlyContributions).map((k) => {
      const contribs = monthlyContributions[k].map((item: any) => {
        if (!isEmpty(item)) {
          return item.url;
        }
      });
      const uniqueContribs = uniq(contribs).length;
      return {
        "month": k,
        "unique contributors": uniqueContribs,
        "number of commits": monthlyContributions[k].length,
      };
    });
    const contribOutput: Array<any> = Object.keys(contributors).map((k) => {
      return {
        "url": k,
        "contributions": contributors[k],
      };
    });
    return {commitOutput, contribOutput};
  }
}

const main = () => {
  const s = new ScraperService();
  const info = gh(process.argv[2]);
  const homedir = require("os").homedir();
  s.fetchContributors(`https://api.github.com/repos/${info.repo}/commits`)
    .then(async (res: any) => {
      console.log(res);
      const csvWriter1 = createObjectCsvWriter({
        path: `${homedir}/Desktop/commits.csv`,
        header: [
            {id: "month", title: "month"},
            {id: "unique contributors", title: "unique contributors"},
            {id: "number of commits", title: "number of commits"},
        ]
      });
      await csvWriter1.writeRecords(res.commitOutput.slice(0, res.commitOutput.length - 1));
      console.log("Wrote output to ~/Desktop/commits.csv");
      const csvWriter2 = createObjectCsvWriter({
        path: `${homedir}/Desktop/contributors.csv`,
        header: [
            {id: "url", title: "url"},
            {id: "contributions", title: "contributions"},
        ]
      });
      await csvWriter2.writeRecords(res.contribOutput);
      console.log("Wrote output to ~/Desktop/contributors.csv");
    })
    .catch(console.error);
};

main();
