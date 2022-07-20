pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: MIT

contract AccessTests {
    mapping(address => string) public hasAccess;

    function giveAccess(
        string calldata encryptedMessage,
        // address[] calldata listOfAddress
        address accessAddress
    ) public {
        hasAccess[accessAddress] = encryptedMessage;
    }
}
