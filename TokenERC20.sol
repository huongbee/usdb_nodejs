contract TokenERC20{
 
    string public name="TokenERC20";
    string public symbol="TokenERC20";
    
    uint256 public totalSupply; 
    uint256 public price = 50;
    uint256 public decimals = 18; 

    address Owner;
    
    mapping (address => uint256) balances; 
    event Transfer(address indexed from, address indexed to, uint256 value);
    constructor() public { 
        Owner = msg.sender;
        name="TokenERC20";
        symbol="TokenERC20";
        totalSupply = 1000*10**18;
        balances[Owner] = totalSupply;
    }

    modifier onlyOwner(){
        require(msg.sender == Owner);
        _;
    }

    modifier validAddress(address _to){
        require(_to != address(0x00));
        _;
    }
    
    
    function balanceOf(address _owner) view public returns(uint256){
        return balances[_owner];
    }
   
    /*
     * @dev Transfers sender's tokens to a given address. Returns success.
     * @param _from Address of Owner.
     * @param _to Address of token receiver.
     * @param _value Number of tokens to transfer.
     */
    
    function _transfer(address _from, address _to, uint _value) internal {
        require(_to != 0x0);
        require(balances[_from] >= _value);
        require(balances[_to] + _value >= balances[_to]);
        
        uint previousBalances = balances[_from] + balances[_to];
        
        balances[_from] -= _value;
        balances[_to] += _value;
        
        assert(balances[_from] + balances[_to] == previousBalances);
        emit Transfer(_from, _to, _value);
    }

    function transfer(address _to, uint256 _value) public payable onlyOwner returns (bool success) {
        _transfer(msg.sender, _to, _value);
        return true;
    }
    
}