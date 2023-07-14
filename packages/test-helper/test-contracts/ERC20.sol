interface ERC20 {
    function name() view external returns (string memory);
    function symbol() view external returns (string memory);
    function decimals() view external returns (uint8);
    function totalSupply() view external returns (uint256);
    function balanceOf(address user) view external returns (uint256);
}