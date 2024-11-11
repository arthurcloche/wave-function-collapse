(async () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D;
  
    if (!canvas || !ctx) return;
    let WIDTH: number, HEIGHT: number;
    type Cell = {
      id: number;
      collapsed: boolean;
      options: number[];
    };
    type HashMap = {
      lines: number[][];
      columns: number[][];
      squares: number[][];
    };
    type Branch = {
      cells: Cell[];
      hashmap: HashMap;
    };
    const SUB = 3;
    const DIM = SUB * SUB;
    const BOARD = DIM * DIM;
    const COLORS = [
      "coral",
      "cornsilk",
      "aquamarine",
      "darkgoldenrod",
      "darksalmon",
      "gold",
      "greenyellow",
      "mistyrose",
      "navy",
    ];
    let size = 0;
    let grid: Cell[] = [];
    let cells: Cell[] = [];
    let hashmap: HashMap = { lines: [], columns: [], squares: [] };
    let branches: Branch[] = [];
    const PLAYS = [
      [
        6, 0, 0, 0, 0, 9, 0, 0, 4, 0, 8, 9, 5, 0, 0, 0, 1, 6, 5, 0, 0, 0, 6, 0, 3,
        0, 9, 8, 3, 1, 0, 0, 0, 7, 0, 5, 0, 2, 0, 0, 0, 0, 0, 6, 0, 9, 0, 7, 0, 0,
        0, 8, 4, 2, 2, 0, 6, 0, 1, 0, 0, 0, 8, 3, 7, 0, 0, 0, 6, 9, 2, 0, 1, 0, 0,
        3, 0, 0, 0, 0, 7,
      ],
      [
        0, 0, 0, 9, 0, 0, 1, 0, 2, 7, 0, 0, 3, 0, 0, 6, 0, 0, 0, 0, 2, 0, 0, 0, 0,
        3, 0, 9, 0, 0, 0, 0, 8, 7, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 9, 0, 0, 6, 5, 0,
        0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 9, 0, 0, 6, 8, 0, 3,
        0, 0, 6, 0, 0, 0,
      ],
    ];
  
    const PLAY = PLAYS[0];
    const setCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.textRendering = "optimizeLegibility";
      ctx.font = "12px Arial";
    };
    const init = () => {
      setCanvas();
  
      WIDTH = 360;
      HEIGHT = 360;
      size = WIDTH / DIM;
      const board = PLAY;
  
      for (let i = 0; i < BOARD; i++) {
        if (board[i] === 0) {
          grid[i] = {
            id: i,
            collapsed: false,
            options: new Array(9).fill(0).map((_, i) => i + 1),
          };
        } else {
          grid[i] = {
            id: i,
            collapsed: true,
            options: [board[i]],
          };
        }
      }
  
      cells = grid.slice();
    };
  
    const initHashmap = () => {
      hashmap.lines = Array(DIM)
        .fill([])
        .map((_, id) => {
          let taken = [];
          for (let i = 0; i < DIM; i++) {
            const cell = grid[i + id * DIM];
            if (cell.collapsed) taken.push(cell.options[0]);
          }
          return taken.sort();
        });
      hashmap.columns = Array(DIM)
        .fill([])
        .map((_, id) => {
          let taken = [];
          for (let i = 0; i < DIM; i++) {
            const cell = grid[i * DIM + id];
  
            if (cell.collapsed) taken.push(cell.options[0]);
          }
          return taken.sort();
        });
      hashmap.squares = Array(DIM)
        .fill([])
        .map((_, id) => {
          let taken = [];
          const dx = (id % SUB) * SUB;
          const dy = Math.floor(id / SUB) * SUB * DIM;
          for (let i = 0; i < DIM; i++) {
            const x = i % SUB;
            const y = Math.floor(i / SUB) * DIM;
            const offset = x + dx + y + dy;
            const cell = grid[offset];
            if (cell.collapsed) taken.push(cell.options[0]);
          }
          return taken.sort();
        });
    };
  
    const updateHashmap = (cell: Cell, hashmap: HashMap) => {
      const x = cell.id % DIM;
      const y = Math.floor(cell.id / DIM);
      const square = Math.floor(x / SUB) + Math.floor(y / SUB) * SUB;
      hashmap.lines[y].push(cell.options[0]);
      hashmap.columns[x].push(cell.options[0]);
      hashmap.squares[square].push(cell.options[0]);
      hashmap.lines[y].sort();
      hashmap.columns[x].sort();
      hashmap.squares[square].sort();
    };
  
    const reduce = (cell: Cell, hashmap:HashMap) => {
      const reducer = (source: number[], target: number[]) => {
        target.forEach((value, i) => {
          const check = source.indexOf(value);
          if (check !== -1) {
            source.splice(check, 1);
          }
        });
      };
      const x = cell.id % DIM;
      const y = Math.floor(cell.id / DIM);
      const square = Math.floor(x / SUB) + Math.floor(y / SUB) * SUB;
      reducer(cell.options, hashmap.lines[y]);
      reducer(cell.options, hashmap.columns[x]);
      reducer(cell.options, hashmap.squares[square]);
    };
  
    const deepCopyHashmap =(hashmap:HashMap)=>{
      const copy = {
        lines : [],
        columns : [],
        squares : []
      } as HashMap
  
      for(let i=0; i<DIM; i++){
        copy.lines[i] = [...hashmap.lines[i]]
        copy.columns[i] = [...hashmap.columns[i]]
        copy.squares[i] = [...hashmap.squares[i]]
      }
      return copy
    }
  
    const deepCopyCells = (cells: Cell[]) => {
      const copy = [] as Cell[];
      for (let element of cells) {
        copy.push({
          ...element,
        });
      }
      return copy ;
    };
  
    const findCell = (cell: Cell, cells: Cell[]) => {
      return cells.find((_cell) => _cell.id === cell.id);
    };
    
    const branch = (cells: Cell[], hashmap: HashMap, init:boolean = false) => {
      if(init){
        branches.push({ cells, hashmap});
        return
      }
      
      const forceCollapse = (cell: Cell) => {
        for (let i = 0; i < cell.options.length; i++) {
          const copiedCells = deepCopyCells(cells) ;
          const targeted = findCell(cell, copiedCells);
          const copiedHash = deepCopyHashmap(hashmap)
          if (targeted) {
            targeted.options = [cell.options[i]];
            updateHashmap(targeted, copiedHash);
            branches.push({ cells: copiedCells, hashmap: copiedHash });
          }
        }
      };
  
      const firstsorted = cells
        .slice()
        .sort((a, b) => a.options.length - b.options.length)
        .sort((a, b) => Number(a.collapsed) - Number(b.collapsed))[0];
  
      forceCollapse(firstsorted);
    };
  
    let justCollapsed = 0;
    let done = false;
    const collapse = (cells: Cell[], hashmap: HashMap) => {
      if (cells.every((cell) => cell.collapsed)) {
        console.log("All collapsed !");
        done = true;
        return;
      }
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.collapsed) continue;
        reduce(cell, hashmap);
        if (cell.options.length === 1) {
          justCollapsed = cell.id;
          console.log("collapsed !", cell.options[0]);
          cell.collapsed = true;
          updateHashmap(cell, hashmap);
          break;
        }
        if(cell.options.length === 0){
          console.log("Uh-oh, we've hit a contradiction. Let's nuke the branch")
          if(branches.length > 1){
            branches.shift();
            console.log(branches)
            justCollapsed = 0
          } else{
            console.log('This thing has no solution')
          }
          
          break
        }
        if (i === cells.length - 1) {
          console.log("Uh-oh, should be collapsed ! Let's branch ");
          branch(cells, hashmap);
          
          branches.shift();
          console.log(branches)
          justCollapsed = 0;
          break;
        }
      }
    };
  
    const draw = (ctx: CanvasRenderingContext2D) => {
      const iWidth = ctx.canvas.width;
      const iHeight = ctx.canvas.height;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      ctx.translate(10, 10);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "white";
      const currentbranch = branches[0]
      
      for (let i = 0; i < currentbranch.cells.length; i++) {
        const cell = currentbranch.cells[i];
        const x = (i % DIM) * size;
        const y = Math.floor(i / DIM) * size;
        if (cell.collapsed) {
          const gray = 25 + Math.floor((cell.options[0] / DIM) * 200);
          //ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
          ctx.fillStyle = COLORS[cell.options[0]-1]
        } else {
          ctx.fillStyle = "black";
        }
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.fill();
  
        ctx.closePath();
      }
      ctx.restore();
  
      ctx.save();
      ctx.translate(10 + size * 10 , 10);
      ctx.lineWidth = 1;
  
      for (let i = 0; i < grid.length; i++) {
        const cell = currentbranch.cells[i];
        const x = (i % DIM) * size;
        const y = Math.floor(i / DIM) * size;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
  
        if (cell.id === justCollapsed) {
          ctx.fillStyle = "coral";
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, DIM, 0, 2 * Math.PI);
          ctx.fill();
        }
  
        if (cell.collapsed) {
          ctx.fillStyle = "#040404";
          ctx.fillText(
            String(cell.options[0]),
            x + size / 2,
            y + size / 2 + SUB / 2
          );
        }
      }
      ctx.restore();
    };
  
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setCanvas();
      draw(ctx);
    });
  
    init();
    initHashmap();
    branch(cells,hashmap,true)
    draw(ctx);
    
    
    const execute = () => {
      collapse(branches[0].cells, branches[0].hashmap);
      draw(ctx);
      //   if( !done){
      //   setTimeout(()=>{
      //     execute();
      //   },100)
      // }else{
      //   console.log('Done !')
      // }
    };
    // console.log(hashmap)
    execute();
    // execute();
    // execute();
  })();
  