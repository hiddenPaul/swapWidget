//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {IBEP20} from "../interfaces/IBEP20.sol";
import {IPancakeRouter02} from "../interfaces/IPancakeRouter02.sol";
import {IPancakeFactory} from "../interfaces/IPancakeFactory.sol";

import {Auth} from "./Auth.sol";
import {DividendDistributor} from "./DividendDistributor.sol";

contract FlawlessToken is IBEP20, Auth {
    string private constant _name = "Flawless";
    string private constant _symbol = "FLS";

    uint8 private constant _decimals = 18;

    uint256 public constant MAX_INT = type(uint128).max;

    address public migrationBank;
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    address public constant dexRouter = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant oldToken = 0x7a983559e130723B70e45bd637773DbDfD3F71Db;
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    uint256 public _maxTxAmount;
    uint256 public liquidityFee = 100;
    uint256 public reflectionFee = 100;
    uint256 public marketingFee = 300;
    uint256 public feeDenominator = 10000;
    uint256 public swapThreshold;
    
    uint256 private totalFee = 500;

    uint256 private _totalSupply;

    address public autoLiquidityReceiver;
    address public marketingFeeReceiver;
    address public pair;
    address public distributorAddress;

    mapping(address => uint256) _balances;
    mapping(address => mapping(address => uint256)) _allowances;
    mapping(address => bool) isFeeExempt;
    mapping(address => bool) isTxLimitExempt;
    mapping(address => bool) isDividendExempt;

    bool public swapEnabled = true;
    bool public openMigrate = true;
    bool inSwap;

    IPancakeRouter02 public router;
    DividendDistributor distributor;
    IBEP20 old;

    modifier swapping() {
        inSwap = true;
        _;
        inSwap = false;
    }

    constructor(
        address _migrationBank
    ) Auth(msg.sender) {
        require(_migrationBank != address(0)); 
        require(_migrationBank != msg.sender);

        migrationBank = _migrationBank;

        router = IPancakeRouter02(dexRouter);
        pair = IPancakeFactory(router.factory()).createPair(
            WBNB,
            address(this)
        );
        _allowances[address(this)][address(router)] = _totalSupply;
        distributor = new DividendDistributor();
        distributorAddress = address(distributor);

        isFeeExempt[msg.sender] = true;
        isTxLimitExempt[msg.sender] = true;
        isFeeExempt[migrationBank] = true;
        isTxLimitExempt[migrationBank] = true;
        isDividendExempt[migrationBank] = true;
        isFeeExempt[address(this)] = true;
        isTxLimitExempt[address(this)] = true;
        isDividendExempt[address(this)] = true;

        isDividendExempt[pair] = true;
        isDividendExempt[DEAD] = true;



        autoLiquidityReceiver = address(this);
        marketingFeeReceiver = address(this);

        old = IBEP20(oldToken);

        _totalSupply = old.totalSupply();

        _balances[migrationBank] = _totalSupply;

        _maxTxAmount = _totalSupply / 400;
        swapThreshold = _totalSupply / 2000;

        _allowances[address(this)][dexRouter] = MAX_INT;
        _allowances[address(this)][pair] = MAX_INT;

        emit Transfer(address(0), migrationBank, _totalSupply);
    }

    function mint(address account, uint256 amount) internal {
        _balances[account] = _balances[account] + amount;
        _totalSupply = _totalSupply + amount;
    }

    function adminMint(address account, uint256 amount) external authorized {
        mint(account, amount);
    }

    function setOpenMigrate(bool gate) external authorized {
        openMigrate = gate;
    }

    function burn(uint256 amount) external {
        _balances[msg.sender] = _balances[msg.sender] - amount;
        _totalSupply = _totalSupply - amount;
    }

    function setRouter(IPancakeRouter02 value) external authorized {
        router = value;
    }

    function setMarketingFeeReceiver(address value) external authorized {
        marketingFeeReceiver = value;
    }

    function setAutoLiquidityReceiver(address value) external authorized {
        autoLiquidityReceiver = value;
    }

    receive() external payable {}

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function decimals() external pure returns (uint8) {
        return _decimals;
    }

    function symbol() external pure returns (string memory) {
        return _symbol;
    }

    function name() external pure returns (string memory) {
        return _name;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function allowance(address holder, address spender)
        external
        view
        returns (uint256)
    {
        return _allowances[holder][spender];
    }

    function approve(address spender, uint256 amount)
        public
        override
        returns (bool)
    {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function approveMax(address spender) external returns (bool) {
        return approve(spender, _totalSupply);
    }

    function transfer(address recipient, uint256 amount)
        external
        override
        returns (bool)
    {
        return _transferFrom(msg.sender, recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override returns (bool) {

        if (sender != msg.sender) {
            require(
                _allowances[sender][msg.sender] >= amount,
                "Insufficient allowance"
            );
        }

        if (_allowances[sender][msg.sender] != MAX_INT) {
            _allowances[sender][msg.sender] =
                _allowances[sender][msg.sender] -
                amount;
        }

        return _transferFrom(sender, recipient, amount);
    }

    function _transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) internal returns (bool) {
        if (inSwap) {
            return _basicTransfer(sender, recipient, amount);
        }

        checkTxLimit(sender, amount);

        if (shouldSwapBack()) {
            swapBack();
        }

        _balances[sender] = _balances[sender] - amount;

        uint256 amountReceived = shouldTakeFee(sender)
            ? takeFee(sender, amount)
            : amount;

        _balances[recipient] = _balances[recipient] + (amountReceived);

        if (!isDividendExempt[sender]) {
            try distributor.setShare(sender, _balances[sender]) {} catch {}
        }
        if (!isDividendExempt[recipient]) {
            try
                distributor.setShare(recipient, _balances[recipient])
            {} catch {}
        }

        emit Transfer(sender, recipient, amountReceived);
        return true;
    }

    function _basicTransfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal returns (bool) {
        _balances[sender] = _balances[sender] - amount;
        _balances[recipient] = _balances[recipient] + (amount);
        return true;
    }

    function migrate(uint256 amount) external {
        require(openMigrate == true);

        require(
            old.transferFrom(msg.sender, DEAD, amount) == true,
            "Failed to burn old token"
        );

        _basicTransfer(migrationBank, msg.sender, amount);
        distributor.setShare(msg.sender, amount);
    }

    function checkTxLimit(address sender, uint256 amount) internal view {
        require(
            amount <= _maxTxAmount || isTxLimitExempt[sender],
            "TX Limit Exceeded"
        );
    }

    function shouldTakeFee(address sender) internal view returns (bool) {
        return !isFeeExempt[sender];
    }

    function takeFee(address sender, uint256 amount)
        internal
        returns (uint256)
    {
        uint256 feeAmount = (amount * totalFee) / (feeDenominator);

        _balances[address(this)] = _balances[address(this)] + (feeAmount);
        emit Transfer(sender, address(this), feeAmount);

        return amount - (feeAmount);
    }

    function shouldSwapBack() internal view returns (bool) {
        return
            msg.sender != pair &&
            !inSwap &&
            swapEnabled &&
            _balances[address(this)] >= swapThreshold;
    }

    function swapBack() internal swapping {
        uint256 amountToLiquify = (swapThreshold * (liquidityFee)) /
            (totalFee) /
            (2);
        uint256 amountToSwap = swapThreshold - (amountToLiquify);

        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = WBNB;
        uint256 balanceBefore = address(this).balance;

        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountToSwap,
            0,
            path,
            address(this),
            block.timestamp
        );

        uint256 amountBNB = address(this).balance - (balanceBefore);

        uint256 totalBNBFee = totalFee - (liquidityFee / (2));

        uint256 amountBNBLiquidity = (amountBNB * (liquidityFee)) /
            (totalBNBFee) /
            (2);

        uint256 amountBNBReflection = (amountBNB * (reflectionFee)) /
            (totalBNBFee);

        uint256 amountBNBMarketing = (amountBNB * (marketingFee)) /
            (totalBNBFee);

        try distributor.deposit{value: amountBNBReflection}() {} catch {}
        payable(marketingFeeReceiver).transfer(amountBNBMarketing);

        if (amountToLiquify > 0) {
            router.addLiquidityETH{value: amountBNBLiquidity}(
                address(this),
                amountToLiquify,
                0,
                0,
                autoLiquidityReceiver,
                block.timestamp
            );
            emit AutoLiquify(amountBNBLiquidity, amountToLiquify);
        }
    }

    function setTxLimit(uint256 amount) external authorized {
        require(amount >= _totalSupply / 1000);
        _maxTxAmount = amount;
    }

    function setIsDividendExempt(address holder, bool exempt)
        external
        authorized
    {
        require(holder != address(this) && holder != pair);
        isDividendExempt[holder] = exempt;
        if (exempt) {
            distributor.setShare(holder, 0);
        } else {
            distributor.setShare(holder, _balances[holder]);
        }
    }

    function setIsFeeExempt(address holder, bool exempt) external authorized {
        isFeeExempt[holder] = exempt;
    }

    function setIsTxLimitExempt(address holder, bool exempt)
        external
        authorized
    {
        isTxLimitExempt[holder] = exempt;
    }

    function setFees(
        uint256 liq,
        uint256 reflection,
        uint256 market,
        uint256 feeDenom
    ) external authorized {
        require(liq <= feeDenom / 5);
        require(reflection <= feeDenom / 5);
        require(market <= feeDenom / 5);

        liquidityFee = liq;
        reflectionFee = reflection;
        marketingFee = market;

        totalFee = liquidityFee + reflectionFee + marketingFee;

        feeDenominator = feeDenom;
    }

    function setSwapBackSettings(bool _enabled, uint256 _amount)
        external
        authorized
    {
        swapEnabled = _enabled;
        swapThreshold = _amount;
    }

    function setDistributionCriteria(
        uint256 _minPeriod,
        uint256 _minDistribution
    ) external authorized {
        distributor.setDistributionCriteria(_minPeriod, _minDistribution);
    }

    function getCirculatingSupply() public view returns (uint256) {
        return
            _totalSupply -
            (balanceOf(DEAD)) -
            (balanceOf(0x0000000000000000000000000000000000000000));
    }

    event AutoLiquify(uint256 amountBNB, uint256 amountBOG);

    function testIsDividendExemptAccounts(address addr)
        public
        view
        returns (bool)
    {
        return isDividendExempt[addr];
    }

    function testIsFeeExemptAccounts(address addr) public view returns (bool) {
        return isFeeExempt[addr];
    }
}