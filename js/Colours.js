class Colours{
    DARK_BLUE = 0x4F7DB3;
    LIGHT_BLUE = 0x7CA1CC;
    DARK_RED = 0xD9736A;
    LIGHT_RED = 0xFF897E;
    DARK_YELLOW = 0xFFC821;
    LIGHT_YELLOW = 0xFFE083;

    pallet = [this.DARK_BLUE, this.LIGHT_BLUE, this.DARK_RED, this.LIGHT_RED, this.DARK_YELLOW, this.LIGHT_YELLOW];
	subPallets = [[this.DARK_BLUE,this.LIGHT_BLUE],[this.DARK_RED,this.LIGHT_RED],[this.DARK_YELLOW, this.LIGHT_YELLOW]]
	
    numColours = this.pallet.length;

    getRandomColour(){
        var randomColour = this.pallet[Math.floor(Math.random() * this.numColours)];
        return randomColour;
    }

	getInitialTargetColours(identityColour){

		for(var i = 0; i < this.subPallets.length; i++) {
			if(this.subPallets[i].includes(identityColour)){ 
				return this.subPallets[i]; 
			}
		}
		console.log("getInitialTargetColours(): no subpallet returning for initial target colour assignment")
	}

    getPseudoRandomColour(colourToNotGet){
        var randomColour = this.pallet[Math.floor(Math.random() * this.numColours)];
        while (randomColour === colourToNotGet){
            randomColour = this.pallet[Math.floor(Math.random() * this.numColours)];
        }
        return randomColour;
    }
}

module.exports = Colours