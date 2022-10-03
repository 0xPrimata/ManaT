async function fetchABI(avalanche) {
    const response = await fetch(
      `https://api.${
        avalanche ? "snowtrace" : "etherscan"
      }.io/api?module=contract&action=getabi&address=${
        process.env.CONTRACT
      }&apikey=${process.env.ETHERSCAN_API_KEY}`,
      { method: "GET" }
    );
  
    if (!response.ok) {
      throw new Error(`unable to fetch abi`);
    }
    const data = await response.json();
    abi = data;
  }
  