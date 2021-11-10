const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Gets the 4-Bit Hex equivalent of a number
Number.prototype.toHex = function() {
  if (this < 0 || this > 15) throw 'Tried to convert number outwith four bits to hex.';
  return this.toString(16).toUpperCase();
};

// Gets the 4-Bit Binary equivalent of a number
Number.prototype.toBin = function() {
  if (this < 0 || this > 15) throw 'Tried to convert number outwith four bits to binary.';
  return this.toString(2).padStart(4,"0");
};

// Gets the Sign Bit of a binary number
Number.prototype.signBit = function() {
  return this.toBin().split("")[0];
};

class TinyMachine {

  /**
   * constructor - Creates a TinyMachine from a predefined initial state.
   *
   * @param  {string} registers     The 4 character string that defines the TM registers
   * @param  {string} memory        The 16 character string that defines the TM memory
   * @param  {array} inputQueue     An array of indeterminate length determining the input queue for the TM. Inputs should be 4bit hex values.
   */
  constructor(registers, memory, inputQueue) {
    this.registers = registers.length == 4 ? registers : false;
    this.memory = memory.length == 16 ? memory : false;

    if (!this.registers | !this.memory) throw `Invalid TinyMachine starting state. (invalid ${(!this.registers) ? "registers" : "memory"})`;

    this.inputQueue = inputQueue;

    this.OPR = "-";     // OPR
    this.OPERAND = "-"; // &
    this.INPUT = "-";   // ?
    this.OUTPUT = "-";  // !

    this.outputQueue = [];
    this.traceLines = [];
    this.haltReason = "Tiny machine halted... weirdly.";

  }

  /**
   * REGISTERS
   */

   /**
    * get IP - Returns the value of the Instruction Pointer converted to an integer
    *
    * @return {integer}  Current value of the Instruction Pointer
    */
  get IP() {
    return parseInt(this.registers[0],16);
  }

  /**
   * set _IP - Updates the Instruction Pointer
   *
   * @param  {integer} value New value of the Instruction Pointer as an integer
   */
  set _IP(value) {
    let updatedRegisters = this.registers.split("");
    updatedRegisters[0] = Math.abs(value).toHex();
    this.registers = updatedRegisters.join("");
  }

  /**
   * incrementIP - Increments the instruction pointer by a specified amount
   *
   * @param  {integer} amount Amount to increment IP by as an integer
   */
  incrementIP(amount) {
    let updatedIP = this.IP;
    updatedIP += amount;
    if (updatedIP > 15) updatedIP-=16
    this._IP = updatedIP;
  }

  /**
   * get LI - Returns the value of the Loop Index converted to an integer
   *
   * @return {integer}  Current value of the Loop Index
   */
  get LI() {
    return parseInt(this.registers[1],16);
  }

  /**
   * set _LI - Updates the Loop Index
   *
   * @param  {integer} value New value of the Loop Index as an integer
   */
  set _LI(value) {
    let updatedRegisters = this.registers.split("");
    updatedRegisters[1] = Math.abs(value).toHex();
    this.registers = updatedRegisters.join("");
  }

  /**
   * decrementLI - Decrements the loop index by a specified amount
   *
   * @param  {integer} amount Amount to decrement LI by as an integer
   */
  decrementLI(amount) {
    let updatedLI = this.LI;
    updatedLI -= amount;
    if (updatedLI < 0) updatedLI+=16;
    this._LI = updatedLI;
  }

  /**
   * get AC - Returns the value of the Accumulator converted to an integer
   *
   * @return {integer}  Current value of the Accumulator
   */
  get AC() {
    return parseInt(this.registers[3],16);
  }

  /**
   * set _AC - Updates the Accumulator
   *
   * @param  {integer} value New value of the Accumulator as an integer
   */
  set _AC(value) {
    let updatedRegisters = this.registers.split("");
    updatedRegisters[3] = Math.abs(value).toHex();
    this.registers = updatedRegisters.join("");
  }

  /**
   * FLAGS
   */

  // GETTERS

  /**
   * get FR - Returns the value of the Flag Register converted to an integer
   *
   * @return {integer}  Current value of the Flag Register
   */
  get FR() {
    return parseInt(this.registers[2],16);
  }

  /**
   * get FlagBits - Returns the value of the Flag Register converted into a 4 bit binary number, then split into an array of Bits
   *
   * @return {Array}  An array of Bits that make up the value of the Flag Register
   */
  get FlagBits() {
    return this.FR.toBin().split("");
  }

  /**
   * get HF - Returns the value of the Halt Flag as a boolean
   *
   * @return {boolean}  Value of the Halt Flag as a boolean
   */
  get HF() {
    return this.FlagBits[0] > 0 ? true : false;
  }

  /**
   * get OF - Returns the value of the Overflow Flag as a boolean
   *
   * @return {boolean}  Value of the Overflow Flag as a boolean
   */
  get OF() {
    return this.FlagBits[1] > 0 ? true : false;
  }

  /**
   * get ZF - Returns the value of the Zero Flag as a boolean
   *
   * @return {boolean}  Value of the Zero Flag as a boolean
   */
  get ZF() {
    return this.FlagBits[2] > 0 ? true : false;
  }

  /**
   * get CF - Returns the value of the Carry Flag as a boolean
   *
   * @return {boolean}  Value of the Carry Flag as a boolean
   */
  get CF() {
    return this.FlagBits[3] > 0 ? true : false;
  }

  // SETTERS

  /**
   * set _FR - Updates the registers with a new value for the Flag Register
   *
   * @param  {integer} value New value of FR as an integer
   */
  set _FR(value) {
    let updatedRegisters = this.registers.split("");
    updatedRegisters[2] = Math.abs(value).toHex();
    this.registers = updatedRegisters.join("");
  }

  /**
   * set _FlagBits - Updates the registers with a new value for FR
   *
   * @param  {string} value New value of FR as a 4bit binary string
   */
  set _FlagBits(value) {
    // input will be like "0010"
    this._FR = parseInt(value, 2);
  }

  /**
   * set _HF - Updates the Halt Flag
   *
   * @param  {Bit} value New value of the Halt Flag as a Bit
   */
  set _HF(value) {
    let updatedFlagBits = this.FlagBits;
    updatedFlagBits[0] = value;
    this._FlagBits = updatedFlagBits.join("");
  }

  /**
   * set _OF - Updates the Overflow Flag
   *
   * @param  {Bit} value New value of the Overflow Flag as a Bit
   */
  set _OF(value) {
    let updatedFlagBits = this.FlagBits;
    updatedFlagBits[1] = value;
    this._FlagBits = updatedFlagBits.join("");
  }

  /**
   * set _ZF - Updates the Zero Flag
   *
   * @param  {Bit} value New value of the Zero Flag as a Bit
   */
  set _ZF(value) {
    let updatedFlagBits = this.FlagBits;
    updatedFlagBits[2] = value;
    this._FlagBits = updatedFlagBits.join("");
  }

  /**
   * set _CF - Updates the Carry Flag
   *
   * @param  {Bit} value New value of the Carry Flag as a Bit
   */
  set _CF(value) {
    let updatedFlagBits = this.FlagBits;
    updatedFlagBits[3] = value;
    this._FlagBits = updatedFlagBits.join("");
  }

  /**
   * ADDRESS REFERENCES
   */

   /**
    * get pointerAddrValue - Returns the memory value at the index of the Instruction Pointer
    *
    * @return {integer}  Value of memory address as an integer
    */
   get pointerAddrValue() {
     return parseInt(this.memory[this.IP],16);
   }

   /**
    * valueAt - Returns the memory value at a specified index
    *
    * @param  {integer} index Memory index to read from as an integer
    * @return {integer}       Value of memory address as an integer
    */
   valueAt(index) {
     //if (updatedIP > 15) updatedIP-=16
     if (index>15) index -= 16;
     else if (index<0) index += 16;
     return parseInt(this.memory[index],16);
   }

   /**
    * MEMORY
    */

  /**
   * editMemory - Updates the memory value at a specified index
   *
   * @param  {integer} index Memory index to edit as an integer
   * @param  {hex}     value New value of memory address as a 4bit hexadecimal number
   */
  editMemory(index, value) {
    // index should be int, value should be hex
    if (index>15) index -= 16;
    else if (index<0) index += 16;
    let updatedMemory = this.memory.split("");
    updatedMemory[index] = value;
    this.memory = updatedMemory.join("");
  }

  /**
   * INPUT
   */

   /**
    * get nextInput - Returns the first value of the Input Queue, and removes it
    *
    * @return {hex}  First value from Input Queue as a 4bit hexadecimal number
    */
   get nextInput() {
     return this.inputQueue.shift();
   }

  /**
   * FUNCTIONS
   */

  log() {
    this.traceLines.push({ registers: this.registers, memory: this.memory, OPR: this.OPR, OPERAND: this.OPERAND, INPUT: this.INPUT ?? "~", OUTPUT: this.OUTPUT });
    return;
  }

  trace(fresh) {

    if (fresh) {
      if (this.HF) console.log('\x1b[31m%s\x1b[0m', "Did you set your registers properly? Tiny's HF is already set.")
      this.outputQueue = [];
      this.traceLines = [];
      this.haltReason = "Tiny machine halted... weirdly.";
    };

    this.OPR = "-";     // OPR
    this.OPERAND = "-"; // &
    this.INPUT = "-";   // ?
    this.OUTPUT = "-";  // !

    if (!this.HF) {

      try {

        switch(this.pointerAddrValue) {
          case 0:
            // HLT
            this.OPR = "HLT";
              this.log();
            this._HF = 1; // set halt flag
            this.haltReason = "Tiny machine halted normally.";
            this.incrementIP(1);
            break;
          case 1:
            // JMP
            this.OPR = "JMP";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();
            this._IP = parseInt(this.OPERAND,16); // update IP to operand
            break;
          case 2:
            // JZE
            this.OPR = "JZE";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();
            if (this.ZF) this._IP = parseInt(this.OPERAND,16); // if zero flag is set, update IP to operand
            else this.incrementIP(2);
            break;
          case 3:
            // JNZ
            this.OPR = "JNZ";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();
            if (!this.ZF) this._IP = parseInt(this.OPERAND,16); // if zero flag is NOT set, update IP to operand
            else this.incrementIP(2);
            break;
          case 4:
            // LDA
            this.OPR = "LDA";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();
            this._AC = this.valueAt(parseInt(this.OPERAND,16)); // set AC to value at memory index OPERAND
            this._ZF = this.AC < 1 ? 1 : 0; // if AC is zero set ZF, else unset ZF
            this.incrementIP(2);
            break;
          case 5:
            // STA
            this.OPR = "STA";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();
            this.editMemory(parseInt(this.OPERAND,16), this.AC.toHex()); // set memory index OPERAND to value of AC
            this.incrementIP(2);
            break;
          case 6:
            // GET
            this.OPR = "GET";
            this.INPUT = this.nextInput // get input from Input Queue
              this.log();
            if (this.INPUT) this._AC = parseInt(this.INPUT,16); // if not starved for input, set AC to Input
            else throw "Starved for input!";
            this._ZF = this.AC < 1 ? 1 : 0; // if AC is zero set ZF, else unset ZF
            this.incrementIP(1);
            break;
          case 7:
            // PUT
            this.OPR = "PUT";
            this.OUTPUT = this.AC.toHex(); // set OUTPUT to AC
              this.log();
            this.outputQueue.push(this.OUTPUT); // push output to Output Queue
            this.incrementIP(1);
            break;
          case 8:
            // ROL
            this.OPR = "ROL";
              this.log();

            // math operation
            let ROL = (this.AC * 2) + (this.CF ? 1 : 0); // Double AC and add Carry Bit
            let ROL_CF = Math.floor(ROL/16); // Get new carry
            if (ROL>=16) ROL -= 16; // Overflow AC
            // get overflow
            this._OF = (this.AC.signBit() != ROL.signBit()) ? 1 : 0; // overwrite OF (and update FR)

            this._AC = ROL; // set AC
            this._CF = ROL_CF; // set CF
            this._ZF = this.AC < 1 ? 1 : 0; // if AC is zero set ZF, else unset ZF
            this.incrementIP(1);
            break;
          case 9:
            // ROR
            this.OPR = "ROR";
              this.log();

            // math operation
            let ROR = Math.floor(this.AC / 2) + (this.CF ? 8 : 0); // Half AC (rounding down) and add Carry Bit (in 8's place)
            let ROR_CF = this.AC % 2; // Get remainder of halfing AC (ie carry)
            // overflow
            this._OF = (this.AC.signBit() != ROR.signBit()) ? 1 : 0; // overwrite OF (and update FR)

            this._AC = ROR; // set AC
            this._CF = ROR_CF; // set CF
            this._ZF = this.AC < 1 ? 1 : 0; // if AC is zero set ZF, else unset ZF
            this.incrementIP(1);
            break;
          case 10:
            // ADC
            this.OPR = "ADC";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();

            // math operation
            let OPERAND_VAL = this.valueAt(parseInt(this.OPERAND,16)); // read value from address (pointed by OPERAND)
            let ADC = this.AC + OPERAND_VAL + (this.CF ? 1 : 0); // Add AC, value loaded into OPERAND and Carry Bit together
            let ADC_CF = Math.floor(ADC/16); // Get carry
            if (ADC >=16) ADC -= 16; // AC Overflow
            // get overflow
            // [0]110                          // [1]000
            // [0]100                          // [1]010
            // [1]010 = overflow (carry 0)     // [0]010 = overflow (carry 1)
            this._OF = (this.AC.signBit() == OPERAND_VAL.signBit() && this.AC.signBit() != ADC.signBit()) ? 1 : 0; // overwrite OF (and update FR)

            this._AC = ADC; // set AC
            this._CF = ADC_CF; // set CF
            this._ZF = this.AC < 1 ? 1 : 0; // if AC is zero set ZF, else unset ZF
            this.incrementIP(2);
            break;
          case 11:
            // CCF
            this.OPR = "CCF";
              this.log();
            this._CF = 0; // clear carry flag
            this.incrementIP(1);
            break;
          case 12:
            // SCF
            this.OPR = "SCF";
              this.log();
            this._CF = 1; // set carry flag
            this.incrementIP(1);
            break;
          case 13:
            // DEL
            this.OPR = "DEL";
              this.log();
            this.decrementLI(1); // decrement LI
            this._ZF = this.LI < 1 ? 1 : 0; // if LI is 0 then set ZF, else unset ZF
            this.incrementIP(1);
            break;
          case 14:
            // LDL
            this.OPR = "LDL";
            this.OPERAND = this.valueAt(this.IP+1).toHex(); // set operand to next value in memory
              this.log();
            this._LI = this.valueAt(parseInt(this.OPERAND,16)); // set LI to value at memory index OPERAND
            this._ZF = this.LI < 1 ? 1 : 0; // if LI is 0 then set ZF, else unset ZF
            this.incrementIP(2);
            break;
          case 15:
            // FLA
            this.OPR = "FLA";
              this.log();
            this._AC = 15 - this.AC; // flip AC by doing (F - AC) ie 15 - AC
            this.incrementIP(1);
            break;
          default:
            throw `Unknown opcode ${parseInt(this.memory[this.IP],16)} passed to TinyMachine`
        };

        this.trace();

      } catch(err) {
        this.haltReason = err;
        this.displayTrace();
      };

    } else {
        // HALT
        this.traceLines.push({ registers: this.registers, memory: this.memory, OPR: "", OPERAND: "", INPUT: "", OUTPUT: "" });
        this.displayTrace();
    };

  }

  displayTrace() {

    let traceLines = [];

    this.traceLines.forEach(line => {
      traceLines.push(`${line.registers.split("").join(" ")}  ${line.memory}  ${line.OPR} ${line.OPERAND} ${line.INPUT} ${line.OUTPUT}`)
    });

    let normalDisplayLines = [];
    let dotDisplayLines = [];

    traceLines.forEach((line, i) => {
      if (i==0) { normalDisplayLines.push(line); dotDisplayLines.push(line); return; }

      let thisNormalLine = "";
      let thisDotLine = "";

      for (let c=0;c<25;c++) {
        if (traceLines[i-1][c] == line[c] && line[c] != " ") {
          thisNormalLine += line[c];
          thisDotLine += ".";
        } else {
          thisNormalLine += `\x1b[32m${line[c]}\x1b[0m`;
          thisDotLine += line[c];
        };
      };
      normalDisplayLines.push(thisNormalLine+(line.slice(25) ?? ""));
      dotDisplayLines.push(thisDotLine+(line.slice(25) ?? ""));
    });


    console.log('\x1b[33m%s\x1b[0m', "\nTINY TRACE:\nI L F A  Memory----------  Action---\nP I R C  0123456789ABCDEF  OPR & ? !");
    normalDisplayLines.forEach(line => console.log(line));

    console.log('\x1b[33m%s\x1b[0m', "\nDOT FORMAT:\nI L F A  Memory----------  Action---\nP I R C  0123456789ABCDEF  OPR & ? !")
    dotDisplayLines.forEach(line => console.log(line));

    console.log('\n\x1b[33m%s\x1b[0m', this.haltReason);
    if (this.outputQueue.length > 0) console.log('\x1b[32m%s\x1b[0m', `Output: `, this.outputQueue.join(""));
    console.log(""); // empty line

  }
}

let asciiTitle = `  _   _                                            __  \n | | (_)                                        _  \\ \\ \n | |_ _ _ __  _   _    ___ _ __ ___  _   _     (_)  | |\n | __| | '_ \\| | | |  / _ \\ '_ \` _ \\| | | |         | |\n | |_| | | | | |_| | |  __/ | | | | | |_| |     _   | |\n  \\__|_|_| |_|\\__, |  \\___|_| |_| |_|\\__,_|    (_)  | |\n               __/ |                               /_/ \n              |___/                                    `

console.log('\x1b[35m%s\x1b[0m', asciiTitle + "  v1.1.0, by @shmove#0615");

console.log('\x1b[36m%s\x1b[0m',"\ntry typing '\x1b[33mhelp\x1b[36m' if you've never used tinyemu before!\nNOTE THAT RIGHT CLICKING WILL PASTE INTO PROMPTS LIKE THESE :)\n");

let tm = new TinyMachine("0000","0000000000000000",[]);

function main() {

  readline.question(`\x1b[32mtinyemu> \x1b[0m`, userInput => {
    userInput = userInput.trim();
    let command = userInput.split(" ")[0];
    let args = userInput.slice(command.length + 1) ?? null;
    switch(command.toLowerCase()) {
      case "help":
        console.log("\n    TINYEMU COMMANDS");
        console.log("    \x1b[32mreg\x1b[0m   - print or set tiny registers");
        console.log("    \x1b[32mmem\x1b[0m   - print or set tiny memory");
        console.log("    \x1b[32minp\x1b[0m   - print or set tiny input queue");
        console.log("    \x1b[32mtrace\x1b[0m - run a tiny trace with current registers, memory & input queue");
        console.log("    \x1b[32mhelp\x1b[0m  - list of commands");
        console.log(""); // empty line
        break;
      case "reg":
        if (!args) console.log(tm.registers);
        else {
          if (validateRegisters(args)) { tm.registers = args; console.log('\x1b[36m%s\x1b[0m', "Updated tiny registers."); }
          else console.log('\x1b[33m%s\x1b[0m',`Invalid registers. Needs to be 4 characters long and composed of only 4-bit hexadecimal numbers.`);
        };
        break;
      case "mem":
        if (!args) console.log(tm.memory);
        else {
          if (validateMemory(args)) { tm.memory = args; console.log('\x1b[36m%s\x1b[0m', "Updated tiny memory."); }
          else console.log('\x1b[33m%s\x1b[0m',`Invalid memory. Needs to be 16 characters long (yours is ${args.length}) and composed of only 4-bit hexadecimal numbers.`);
        };
        break;
      case "inp":
        if (!args) console.log(tm.inputQueue.length > 0 ? tm.inputQueue.join("") : "Empty queue.");
        else {
          let argsArray = validateInputQueue(args);
          if (argsArray) { tm.inputQueue = argsArray; console.log('\x1b[36m%s\x1b[0m', "Updated tiny input queue."); }
          else console.log('\x1b[33m%s\x1b[0m',"Invalid input queue. Needs to be formatted like this \x1b[36mB1FF015BA3\x1b[33m or this \x1b[36mA, 0, 5, 4, 7");
        }
        break;
      case "trace":
        tm.trace(true);
        break;
      default:
        console.log('\x1b[33m%s\x1b[0m',`Unknown command "${command}"`);
    };
    main();
  });

};

function validateRegisters(registers) {
  if (registers.length != 4) return false;
  for (i=0;i<registers.length;i++) {
    if (isNaN(parseInt(registers[i],16))) return false;
  };
  return true;
};

function validateMemory(memory) {
  if (memory.length != 16) return false;
  for (i=0;i<memory.length;i++) {
    if (isNaN(parseInt(memory[i],16))) return false;
  };
  return true;
};

function validateInputQueue(inputs) {
  if (inputs.length < 1) return false;

  if (inputs.includes(" ")) inputs = inputs.split(" ").join("");
  if (inputs.includes(",")) inputs = inputs.split(",").join("");

  for (i=0;i<inputs.length;i++) {
    if (isNaN(parseInt(inputs[i],16))) return false;
  };

  return inputs.split("");
};

main();
