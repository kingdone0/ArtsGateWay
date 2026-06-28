// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtWayNFT is ERC721, Ownable {
    struct Artwork {
        uint256 tokenId;
        string title;
        string description;
        string imageURI;
        string metadataURI;
        address artist;
        address currentOwner;
        uint256 price;
        bool isForSale;
        uint256 createdAt;
    }

    struct Event {
        uint256 eventId;
        string title;
        string description;
        uint256 totalSeats;
        uint256 pricePerSeat;
        address artist;
        bool approved;
        uint256 createdAt;
    }

    struct Ticket {
        uint256 eventId;
        uint256 price;
        bool redeemed;
    }

    uint256 public nextEventId = 1;
    uint256 public nextTicketId = 1;
    uint256 public nextTokenId = 1;

    mapping(uint256 => Artwork) public artworks;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public eventTicketsSold;

    // ✅ التصحيح: تمرير msg.sender كمالك للعقد
    constructor() ERC721("ArtWayNFT", "AWNFT") Ownable(msg.sender) {}

    // ======================= Mint =========================
    function mintArtwork(
        string memory title,
        string memory description,
        string memory imageURI,
        string memory metadataURI,
        uint256 price
    ) external returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);

        artworks[tokenId] = Artwork({
            tokenId: tokenId,
            title: title,
            description: description,
            imageURI: imageURI,
            metadataURI: metadataURI,
            artist: msg.sender,
            currentOwner: msg.sender,
            price: price,
            isForSale: false,
            createdAt: block.timestamp
        });

        _tokenURIs[tokenId] = metadataURI;
        nextTokenId++;
        return tokenId;
    }

    // ======================= Sale =========================
    function putOnSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can put on sale");
        artworks[tokenId].price = price;
        artworks[tokenId].isForSale = true;
    }

    function removeFromSale(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can remove from sale");
        artworks[tokenId].isForSale = false;
    }

    function purchaseArtwork(uint256 tokenId) public payable {
        Artwork storage art = artworks[tokenId];
        require(art.isForSale, "Not for sale");
        require(msg.value >= art.price, "Insufficient funds");

        address previousOwner = art.currentOwner;
        payable(previousOwner).transfer(msg.value);

        _transfer(previousOwner, msg.sender, tokenId);
        art.currentOwner = msg.sender;
        art.isForSale = false;
    }

    // ======================= Views =========================
    function getArtwork(uint256 tokenId) public view returns (Artwork memory) {
        return artworks[tokenId];
    }

    function getArtworksByArtist(address artist) public view returns (uint256[] memory) {
        uint256 total = nextTokenId - 1;
        uint256 count = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (artworks[i].artist == artist) count++;
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (artworks[i].artist == artist) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }

    function getArtworksByOwner(address owner) public view returns (uint256[] memory) {
        uint256 total = nextTokenId - 1;
        uint256 balance = balanceOf(owner);

        uint256[] memory result = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 1; i <= total && index < balance; i++) {
            if (ownerOf(i) == owner) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }

    // ======================= Token URI =====================
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function mint(address to) public onlyOwner {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        nextTokenId++;
    }

    // ======================= Events =========================
    function createEvent(
        string memory title,
        string memory description,
        uint256 totalSeats,
        uint256 pricePerSeat
    ) external returns (uint256) {
        uint256 eventId = nextEventId;
        events[eventId] = Event({
            eventId: eventId,
            title: title,
            description: description,
            totalSeats: totalSeats,
            pricePerSeat: pricePerSeat,
            artist: msg.sender,
            approved: false,
            createdAt: block.timestamp
        });
        nextEventId++;
        return eventId;
    }

    function approveEvent(uint256 eventId) external onlyOwner {
        events[eventId].approved = true;
    }

    // ======================= Booking =====================
    function bookTicket(uint256 eventId) external payable returns (uint256) {
        Event storage evt = events[eventId];
        require(evt.approved, "Event not approved yet");
        require(eventTicketsSold[eventId] < evt.totalSeats, "No seats left");
        require(msg.value >= evt.pricePerSeat, "Insufficient payment");

        uint256 tokenId = nextTicketId;
        _safeMint(msg.sender, tokenId);

        tickets[tokenId] = Ticket({
            eventId: eventId,
            price: msg.value,
            redeemed: false
        });

        eventTicketsSold[eventId] += 1;
        nextTicketId++;

        payable(evt.artist).transfer(msg.value);

        return tokenId;
    }

    function redeemTicket(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(!tickets[tokenId].redeemed, "Already redeemed");
        tickets[tokenId].redeemed = true;
    }

    // ======================= Views =====================
    function getEvent(uint256 eventId) public view returns (Event memory) {
        return events[eventId];
    }

    function getTicketsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory result = new uint256[](balance);
        uint256 index = 0;
        for (uint256 i = 1; i < nextTicketId; i++) {
            if (ownerOf(i) == owner) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }
}