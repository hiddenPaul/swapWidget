//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {IBEP20} from "../interfaces/IBEP20.sol";

contract DividendDistributor {
    address _token;

    struct Shareholder {
        uint256 numShares;
        uint256 totalExcluded;
        uint256 lastClaimed;
        uint256 totalDue;
    }

    mapping(address => Shareholder) public shareholders;

    uint256 public totalShares;
    uint256 public totalDividends;
    uint256 public totalDistributed;
    uint256 public dividendsPerShare;
    uint256 public dividendsPerShareAccuracyFactor = 10**36;

    uint256 public minPeriod = 1 hours;
    uint256 public minDistribution = 1 * (10**18);

    modifier onlyToken() {
        require(msg.sender == _token);
        _;
    }

    constructor() {
        _token = msg.sender;
    }

    function setDistributionCriteria(
        uint256 _minPeriod,
        uint256 _minDistribution
    ) external onlyToken {
        minPeriod = _minPeriod;
        minDistribution = _minDistribution;
    }

    function setShare(address shareholder, uint256 numShares)
        external
        onlyToken
    {
        if (shareholders[shareholder].numShares > 0) {
            // Update the totalDue for the shareholder since they're not getting paid out at this time. 
            shareholders[shareholder].totalDue = getUnpaidEarnings(shareholder);
        }

        totalShares =
            (totalShares - shareholders[shareholder].numShares) +
            numShares;
        shareholders[shareholder].numShares = numShares;
        shareholders[shareholder].totalExcluded = getCumulativeDividends(
            shareholders[shareholder].numShares
        );
    }

    function deposit() external payable onlyToken {
        
        uint256 amount = msg.value;

        totalDividends = totalDividends + amount;
        
        dividendsPerShare =
            dividendsPerShare +
            ((dividendsPerShareAccuracyFactor * amount) / (totalShares));
    }

    function shouldDistribute(address shareholder)
        internal
        view
        returns (bool)
    {
        return
            shareholders[shareholder].lastClaimed + minPeriod < block.timestamp &&
            getUnpaidEarnings(shareholder) > minDistribution;
    }

    function distributeDividend(address shareholder) internal {
        if (shareholders[shareholder].numShares == 0) {
            return;
        }
        if(!shouldDistribute(shareholder)) {
            return;
        }

        uint256 amount = getUnpaidEarnings(shareholder);

        if (amount > 0) {
            totalDistributed = totalDistributed + (amount);

            shareholders[shareholder].lastClaimed = block.timestamp;

            shareholders[shareholder].totalExcluded = getCumulativeDividends(
                shareholders[shareholder].numShares
            );

            // Setting totalDue to 0 as we have distributed the dividends
            shareholders[shareholder].totalDue = 0;

            payable(shareholder).transfer(amount);
        }
    }

    function claimDividend() external {
        distributeDividend(msg.sender);
    }

    function getUnpaidEarnings(address shareholder)
        public
        view
        returns (uint256)
    {

        uint256 shareholderTotalDue = shareholders[shareholder].totalDue;

        if ((shareholders[shareholder].numShares == 0) && (shareholderTotalDue == 0)) {
            return 0;
        }

        uint256 shareholderCumulativeDividends = getCumulativeDividends(
            shareholders[shareholder].numShares
        );

        uint256 shareholderTotalDividendsEarned = shareholderCumulativeDividends + shareholderTotalDue;
        uint256 shareholderTotalDividendsExcluded = shareholders[shareholder].totalExcluded;

        if (shareholderTotalDividendsEarned <= shareholderTotalDividendsExcluded) {
            return 0;
        }

        return shareholderTotalDividendsEarned - shareholderTotalDividendsExcluded;
    }

    function getCumulativeDividends(uint256 numShares)
        internal
        view
        returns (uint256)
    {
        return
            (numShares * (dividendsPerShare)) /
            (dividendsPerShareAccuracyFactor);
    }
}
