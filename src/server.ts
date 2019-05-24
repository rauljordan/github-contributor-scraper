import rp from "request-promise-native";
import { RequestPromise } from "request-promise-native";

class ScraperService {
  fetchContributors(url: string): RequestPromise<any> {
    return rp(url);
  }
}

const main = () => {
  const s = new ScraperService();
  s.fetchContributors("https://github.com/prysmaticlabs/prysm")
    .then((res: any) => {
      console.log(res);
    });
};

main();
