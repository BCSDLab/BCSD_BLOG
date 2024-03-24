import React from 'react';
import styles from './index.module.css';

export default function HomepageFeatures(): JSX.Element {
  return (
    <main className={styles.wrapper}>
      <span>
        안녕하세요! 저는 FE 트랙 레귤러 정해성입니다! 최근에 저희 FE 트랙에서 새로운 활동을 시작했어요. 다양한 소그룹 
        활동이 있었는데, 그중 저는 기술이나 경험에 관해서 블로그를 써보는 그룹에서 활동하고 있어요. 그렇게 해서 개설된
        게 바로 BCSDLab 전용 기술 블로그입니다! 오늘은 간단히 BCSDLab 블로그가 추구하는 방향 그리고 왜 그렇게
        생각했는지에 대해 말씀드릴게요.
      </span>
      <div className={styles.img_wrapper}>
        <img src="/img/main/img1.png" alt="이미지" className={styles.img} />
      </div>
      <span>
        소그룹이 생기고 초기에 블로그에 어떤 것을 써야 할지 고민만 하면서 시간이 지나가던 중에 블로그 경험이 풍부하신
        BCSD 회장님께서 몇 마디 해주셨어요. 그때 들었던 조언과 제 생각을 섞어서 말씀드릴게요.
      </span>
      <div className={styles.img_wrapper}>
        <img src="/img/main/img2.png" alt="이미지" className={styles.img} />
      </div>
      <span>
        개발자를 목표로 여러 기술 공부를 하면서 이를 기록하고 싶거나 아니면 단순히 하면 좋다고 해서 블로그를 시도하려
        하는 사람이 많이 있을 거예요. 하지만 생각만 하고 시작하지 못하는 사람들도 많이 있죠. 저도 이런 사람 중 하나였기
        때문에 이 원인을 한번 생각해 봤어요.
      </span>
      <br />
      <span>
        제가 찾은 원인은 '완벽주의'에 있다고 생각해요. 인터넷에는 아주 잘 쓰인 글이 많이 있어요. 우리는 그 글들을 보면서
        개발자를 꿈꿔왔고요. 그렇다 보니 무의식중에 블로그를 쓴다면 이 정도 퀄리티를 보여줘야 한다고 생각하게 되는 것
        같아요.
      </span>
      <br />
      <span>
        예를 들어 어떤 기술에 관해서 설명하는 글을 쓰려고 하면 먼저 어떤 내용을 얼마나 넣을지, 지금 알고 있는 내용이
        정확한 내용인지, 빠뜨린 내용은 없는지 찾아가며 기획이 계속 달라질 거예요. 문제는 이 부분에 있다고 생각해요. 물론
        읽는 사람을 위해 양질의 내용을 구하는 것은 중요해요! 하지만 이렇게 에너지를 낭비하고 나면 벌써 글을 쓰기 전부터
        지치게 되어요.
      </span>
      <div className={styles.img_wrapper}>
        <img src="/img/main/img3.png" alt="이미지" className={styles.img} />
      </div>
      <span>
        블로그를 시작하려고 막 마음먹은 사람의 글을 보고 잘 썼네, 틀렸네, 평가하는 사람은 없어요. 어떤 글을 쓰더라도
        문제가 없다는 말이에요. 짧아도 되고, 틀려도 되어요. 오히려 정확하고 장황한 글을 쓰기 위해서 필요 이상의 많은
        에너지를 쓰는 것을 경계해야 해요. 글을 쓸 때마다 지치는 경험이 반복되면 분명 오랫동안 꾸준히 글을 쓰고 싶은
        마음이 사라질 거예요.
      </span>
      <div className={styles.img_wrapper}>
        <img src="/img/main/img4.png" alt="이미지" className={styles.img} />
      </div>
      <span>마지막으로 BCSDLab 블로그의 추구하는 방향성을 요약해 드릴게요.</span>
      <br />
      <div className={styles.rule}>
        <ol>
          <li>형식에 구애 받지 않는다. 짧아도 좋다.</li>
          <li>원하는 주제에 원하는 글을 쓴다.</li>
          <li>정확하지 않아도 괜찮다.</li>
          <li>공감과 피드백은 O, 비판은 X</li>
        </ol>
      </div>
      <br />
      <span>
        모든 사람이 처음부터 잘할 수 있는 것은 아니에요. 이 글도 마찬가지이고요. 저희가 원하는 것은 누구나 자유롭게 글을
        적을 수 있는 공간을 만드는 거예요. 이것저것 시도해 보고 다른 사람들과 소통할 수 있으면 좋겠어요!
      </span>
    </main>
  );
}
