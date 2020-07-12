
OPCODE_LOAD   = vec("7b0000011");
OPCODE_OP_IMM = vec("7b0010011");
OPCODE_AUIPC  = vec("7b0010111");
OPCODE_STORE  = vec("7b0100011");
OPCODE_OP     = vec("7b0110011");
OPCODE_LUI    = vec("7b0110111");
OPCODE_BRANCH = vec("7b1100011");
OPCODE_JALR   = vec("7b1100111");
OPCODE_JAL    = vec("7b1101111");

FUNCT3_ALU_ADD_SUB = vec("3b000");
FUNCT3_ALU_SLL     = vec("3b001");
FUNCT3_ALU_SLT     = vec("3b010");
FUNCT3_ALU_SLTU    = vec("3b011");
FUNCT3_ALU_XOR     = vec("3b100");
FUNCT3_ALU_SHIFTR  = vec("3b101");
FUNCT3_ALU_OR      = vec("3b110");
FUNCT3_ALU_AND     = vec("3b111");

FUNCT3_ALU_TABLE = {
    [FUNCT3_ALU_ADD_SUB:tointeger()] = "add",
    [FUNCT3_ALU_ADD_SUB:tointeger() + 8] = "sub",
    [FUNCT3_ALU_SLL:tointeger()] = "sll",
    [FUNCT3_ALU_SLT:tointeger()] = "slt",
    [FUNCT3_ALU_SLTU:tointeger()] = "sltu",
    [FUNCT3_ALU_XOR:tointeger()] = "xor",
    [FUNCT3_ALU_SHIFTR:tointeger()] = "srl",
    [FUNCT3_ALU_SHIFTR:tointeger() + 8] = "sra",
    [FUNCT3_ALU_OR:tointeger()] = "or",
    [FUNCT3_ALU_AND:tointeger()] = "and",
    add = FUNCT3_ALU_ADD_SUB,
    sub = FUNCT3_ALU_ADD_SUB,
    sll = FUNCT3_ALU_SLL,
    slt = FUNCT3_ALU_SLT,
    sltu = FUNCT3_ALU_SLTU,
    xor = FUNCT3_ALU_XOR,
    srl = FUNCT3_ALU_SHIFTR,
    sra = FUNCT3_ALU_SHIFTR,
    ["or"] = FUNCT3_ALU_OR,
    ["and"] = FUNCT3_ALU_AND
};

FUNCT3_BRANCH_EQ = vec("3b000");
FUNCT3_BRANCH_NE = vec("3b001");
FUNCT3_BRANCH_LT = vec("3b100");
FUNCT3_BRANCH_GE = vec("3b101");
FUNCT3_BRANCH_LTU = vec("3b110");
FUNCT3_BRANCH_GEU = vec("3b111");

FUNCT3_BRANCH_TABLE = {
    [FUNCT3_BRANCH_EQ:tointeger()] = "beq",
    [FUNCT3_BRANCH_NE:tointeger()] = "bne",
    [FUNCT3_BRANCH_LT:tointeger()] = "blt",
    [FUNCT3_BRANCH_GE:tointeger()] = "bge",
    [FUNCT3_BRANCH_LTU:tointeger()] = "bltu",
    [FUNCT3_BRANCH_GEU:tointeger()] = "bgeu",
    beq = FUNCT3_BRANCH_EQ,
    bne = FUNCT3_BRANCH_NE,
    ble = FUNCT3_BRANCH_LE,
    bge = FUNCT3_BRANCH_GE,
    bltu = FUNCT3_BRANCH_LTU,
    bgeu = FUNCT3_BRANCH_GEU
};

FUNCT3_MEM_BYTE = vec("3b000");
FUNCT3_MEM_HALF = vec("3b001");
FUNCT3_MEM_WORD = vec("3b010");
FUNCT3_MEM_BYTE_U = vec("3b100");
FUNCT3_MEM_HALF_U = vec("3b101");

FUNCT3_MEM_TABLE = {
    [FUNCT3_MEM_BYTE:tointeger()] = "b",
    [FUNCT3_MEM_HALF:tointeger()] = "h",
    [FUNCT3_MEM_WORD:tointeger()] = "w",
    [FUNCT3_MEM_BYTE_U:tointeger()] = "bu",
    [FUNCT3_MEM_HALF_U:tointeger()] = "hu",
    b = FUNCT3_MEM_BYTE,
    h = FUNCT3_MEM_HALF,
    w = FUNCT3_MEM_WORD,
    bu = FUNCT3_MEM_BYTE_U,
    hu = FUNCT3_MEM_HALF_U
};

function regname(n)
    return "x" .. n:tointeger()
end

function regcode(s)
    return vec.frominteger(s, 5)
end

function immB(data)
    return (data(31) .. data(7) .. data (25, 6) .. data(8, 4) .. vec(0)):tointegersigned()
end

function immU(data)
    return data(12, 20):tointegersigned()
end

function immJ(data)
    return (data(31) .. data(12, 8) .. data(20) .. data(21, 10) .. vec(0)):tointegersigned()
end

function immI(data)
    return (data(20, 12)):tointegersigned()
end

function immS(data)
    return (data(25, 7) .. data(7, 5)):tointegersigned()
end

REG_REGEX = "(x[0-9]+)";
SEP_REGEX = ", *";
OFF_REGEX = "(-?[0-9]+)";
LOAD_REGEX = "(lbu?|lhu?|lw) +" .. REG_REGEX .. SEP_REGEX .. OFF_REGEX .. "\\(" .. REG_REGEX .. "\\)";
STORE_REGEX = "(sbu?|shu?|sw) +" .. REG_REGEX .. SEP_REGEX .. OFF_REGEX .. "\\(" .. REG_REGEX .. "\\)";
OP_REGEX = "(add|sub|sll|sltu?|xor|sr[la]|or|and) +" .. REG_REGEX .. SEP_REGEX .. REG_REGEX .. SEP_REGEX .. REG_REGEX;
OP_IMM_REGEX = "(addi|subi|slli|sltu?i|xori|srli|ori|andi) +" .. REG_REGEX .. SEP_REGEX .. REG_REGEX .. SEP_REGEX .. OFF_REGEX;
LUI_REGEX = "(lui) +" .. REG_REGEX .. SEP_REGEX .. OFF_REGEX;
AUIPC_REGEX = "(auipc) +" .. REG_REGEX .. SEP_REGEX .. OFF_REGEX;
BRANCH_REGEX = "(beq|bne|bltu?|bgeu?) +" .. REG_REGEX .. SEP_REGEX .. REG_REGEX .. SEP_REGEX .. OFF_REGEX;
JAL_REGEX = "(jal) +" .. REG_REGEX .. SEP_REGEX .. OFF_REGEX;
JALR_REGEX = "(jalr) +" .. REG_REGEX .. SEP_REGEX .. REG_REGEX .. SEP_REGEX .. OFF_REGEX;
INSTR_REGEX = table.concat({LOAD_REGEX, STORE_REGEX, OP_REGEX, OP_IMM_REGEX, LUI_REGEX, AUIPC_REGEX, BRANCH_REGEX, JAL_REGEX, JALR_REGEX}, "|");

REG_PAT = "x(%d+)";
SEP_PAT = ", *";
OFF_PAT = "(-?%d+)";
-- OP
RRR_PAT = "(%l+) +" .. REG_PAT .. SEP_PAT .. REG_PAT .. SEP_PAT .. REG_PAT;
-- OP_IMM, BRANCH, JALR
RRO_PAT = "(%l+) +" .. REG_PAT .. SEP_PAT .. REG_PAT .. SEP_PAT .. OFF_PAT;
-- LUI, AUIPC, JAL
RO_PAT = "(%l+) +" .. REG_PAT .. SEP_PAT .. OFF_PAT;
-- LOAD, STORE
ROR_PAT = "(%l+) +" .. REG_PAT .. SEP_PAT .. OFF_PAT .. "%(" .. REG_PAT .. "%)";

sim.registerdisplay({
    name = "rv32i",
    pattern = "x|[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]|" .. INSTR_REGEX,
    sort = 1,
    can = function(kind, bits)
        return bits == 32
    end,
    read = function(data, bits)
        local op, p1, p2, p3;
        op = string.match(data, "^[%da-f][%da-f][%da-f][%da-f][%da-f][%da-f][%da-f][%da-f]$")
        if op ~= nil then
            return vec.fromhex(op)
        end
        op, p1, p2, p3 = string.match(data, "^" .. RRR_PAT .. "$");
        if op ~= nil then
            local funct3 = FUNCT3_ALU_TABLE[op];
            if funct3 ~= nil then
                local funct7
                if FUNCT3_ALU_TABLE[funct3:tointeger()] == op then
                    funct7 = vec(0, 7)
                else
                    funct7 = vec("7b0100000")
                end
                return funct7 .. regcode(p3) .. regcode(p2) .. funct3 .. regcode(p1) .. OPCODE_OP
            end
        end
        op, p1, p2, p3 = string.match(data, "^" .. RRO_PAT .. "$");
        if op ~= nil then
            if op == "jalr" then
                return vec.frominteger(p3, 12) .. regcode(p2) .. vec(0, 3) .. regcode(p1) .. OPCODE_JALR
            end
            local funct3 = FUNCT3_ALU_TABLE[op:sub(1,-2)];
            if op:sub(-1) == "i" and funct3 ~= nil then
                return vec.frominteger(p3, 12) .. regcode(p2) .. funct3 .. regcode(p1) .. OPCODE_OP_IMM
            end
            funct3 = FUNCT3_BRANCH_TABLE[op];
            if funct3 ~= nil then
                local imm = vec.frominteger(p3, 13)
                return imm(12) .. imm(5, 6) .. regcode(p2) .. regcode(p1) .. funct3 .. imm(1, 4) .. imm(11) .. OPCODE_BRANCH
            end
        end
        op, p1, p2 = string.match(data, "^" .. RO_PAT .. "$");
        if op ~= nil then
            if op == "lui" then
                return vec.frominteger(p2, 20) .. regcode(p1) .. OPCODE_LUI
            elseif op == "auipc" then
                return vec.frominteger(p2, 20) .. regcode(p1) .. OPCODE_AUIPC
            elseif op == "jal" then
                local imm = vec.frominteger(p2, 21)
                return imm(20) .. imm(1, 10) .. imm(11) .. imm(12, 8) .. regcode(p1) .. OPCODE_JAL
            end
        end
        op, p1, p2, p3 = string.match(data, "^" .. ROR_PAT .. "$");
        if op ~= nil then
            local funct3 = FUNCT3_MEM_TABLE[op:sub(2)]
            if funct3 ~= nil and op:sub(1, 1) == "l" then
                return vec.frominteger(p2, 12) .. regcode(p3) .. funct3 .. regcode(p1) .. OPCODE_LOAD
            elseif funct3 ~= nil and op:sub(1, 1) == "s" then
                local imm = vec.frominteger(p2, 12)
                return imm(5, 7) .. regcode(p1) .. regcode(p3) .. funct3 .. imm(0, 5) .. OPCODE_STORE
            end
        end
        return vec("32hxxxxxxxx")
    end,
    show = function(data)
        local opcode = data(0, 7);
        local rd     = data(7, 5);
        local rs1    = data(15, 5);
        local rs2    = data(20, 5);
        local funct3 = data(12, 3);
        local funct7 = data(25, 7);
        if opcode == OPCODE_LOAD then
            local op = FUNCT3_MEM_TABLE[funct3:tointeger()]
            return "l" .. op .. " " .. regname(rd) .. ", " .. immI(data) .. "(" .. regname(rs1) .. ")"
        elseif opcode == OPCODE_STORE then 
            local op = FUNCT3_MEM_TABLE[funct3:tointeger()]
            return "s" .. op .. " " .. regname(rs2) .. ", " .. immS(data) .. "(" .. regname(rs1) .. ")"
        elseif opcode == OPCODE_OP then 
            local op
            if funct7 == vec("7b0100000") then
                op = FUNCT3_ALU_TABLE[funct3:tointeger() + 8]
            else
                op = FUNCT3_ALU_TABLE[funct3:tointeger()]
            end
            return op .. " " .. regname(rd) .. ", " .. regname(rs1) .. ", " .. regname(rs2)
       elseif opcode == OPCODE_OP_IMM then 
            local op = FUNCT3_ALU_TABLE[funct3:tointeger()]
            return op .. "i " .. regname(rd) .. ", " .. regname(rs1) .. ", " .. immI(data)
        elseif opcode == OPCODE_LUI then
            return "lui " .. regname(rd) .. ", " .. immU(data)
        elseif opcode == OPCODE_AUIPC then
            return "auipc " .. regname(rd) .. ", " .. immU(data)
        elseif opcode == OPCODE_BRANCH then 
            local op = FUNCT3_BRANCH_TABLE[funct3:tointeger()]
            return op .. " " .. regname(rs1) .. ", " .. regname(rs2) .. ", " .. immB(data)
        elseif opcode == OPCODE_JAL then 
            return "jal " .. regname(rd) .. ", " .. immJ(data)
        elseif opcode == OPCODE_JALR then 
            return "jalr " .. regname(rd) .. ", " .. regname(rs1) .. ", " .. immI(data)
        elseif data:isfullydefined() then
            return data:tohex()
        else
            return "x"
        end
    end,
    size = function(bits)
        return 20
    end
});

