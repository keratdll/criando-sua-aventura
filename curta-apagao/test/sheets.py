import glob,subprocess,sys,os
os.chdir(sys.argv[1]); fs=sorted(glob.glob('f_*.png'),key=lambda f: float(f[2:-4]))
for i in range(0,len(fs),6):
    g=fs[i:i+6]
    subprocess.run(['ffmpeg','-v','error','-y']+sum([['-i',f] for f in g],[])+['-filter_complex',''.join(f'[{j}:v]scale=300:-1[v{j}];' for j in range(len(g)))+''.join(f'[v{j}]' for j in range(len(g)))+f'hstack=inputs={len(g)}', f'sheet_{i//6}.png'])
