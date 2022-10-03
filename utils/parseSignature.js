const { ethers } = require('ethers');
const { MerkleTree } = require("merkletreejs");
const addr = require("./addr.json");

// generate signature proof
// parse wallet object, not wallet address
async function parseSignature(address) {
    // generate Leaf Nodes
    const leaftNodes = addr.map((address) => ethers.utils.keccak256(address));
    // Generate a Tree
    const tree = new MerkleTree(leaftNodes, ethers.utils.keccak256, {
      sortPairs: true,
    });
  
    const buf2hex = (x) => "0x" + x.toString("hex");
  
    const rootHash = tree.getHexRoot();
    console.log("rootHash", rootHash);
  
    const leaf = ethers.utils.keccak256(address);
    const proof = tree.getProof(leaf).map((x) => buf2hex(x.data));
    return proof;
  }