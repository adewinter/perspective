/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
export function setupStats() {
  const stats = new Stats();
  stats.customFpsPanel = stats.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
  stats.xPanel = stats.addPanel( new Stats.Panel( 'x', '#ff8', '#221' ) );
  stats.yPanel = stats.addPanel( new Stats.Panel( 'y', '#f8f', '#212' ) );
  stats.zPanel = stats.addPanel( new Stats.Panel( 'z', '#0ff', '#002' ) );
  // stats.showPanel(stats.domElement.children.length - 1);
  stats.showPanel(4);
  // stats.showPanel(5);
  // stats.showPanel(6);


  for (var i=3; i<stats.domElement.children.length; i++) {
    stats.domElement.children[i].style.display = 'block';
  }
  const parent = document.getElementById('stats');
  parent.appendChild(stats.domElement);

  const statsPanes = parent.querySelectorAll('canvas');

  for (let i = 0; i < statsPanes.length; ++i) {
    // statsPanes[i].style.width = '140px';
    // statsPanes[i].style.height = '80px';
  }
  return stats;
}