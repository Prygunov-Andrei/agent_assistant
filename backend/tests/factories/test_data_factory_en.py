"""
Test data factory based on classical works (English version)
"""

from typing import List, Dict, Any


class ChekhovTestDataFactoryEN:
    """
    Factory creates test data for projects based on
    Chekhov's classical stories (public domain) - English version
    """
    
    @staticmethod
    def get_chameleon_project() -> Dict[str, Any]:
        """
        Project based on 'The Chameleon' story
        Comedy about a police inspector and a dog
        ALL ROLES from the story
        """
        return {
            'request_text': '''
            Casting actors for film adaptation of comedy "The Chameleon" by A.P. Chekhov.
            
            ROLE 1: Police Inspector Ochumelov - male 45-55 years old,
            comedic talent, ability to show servility and mood changes.
            Height 175-180 cm, full build, clothing size 52-54.
            Experience in comedy roles required.
            Rate: 25000 rub/shift.
            
            ROLE 2: Policeman Yeldyrin - male 30-40 years old, tall height 180-190 cm,
            strong build. Ability to maintain posture, military bearing.
            Rate: 18000 rub/shift.
            
            ROLE 3: Goldsmith Khryukin - male 35-45 years old,
            simple-looking, ability to play victim. Height 165-175 cm.
            Rate: 20000 rub/shift.
            
            ROLE 4: General Zhigalov - male 55-65 years old, impressive appearance,
            military bearing. Episodic role.
            Rate: 15000 rub/shift.
            
            ROLE 5: Passerby from crowd - male any age, extras.
            Rate: 5000 rub/shift.
            
            ROLE 6: Cook (from crowd) - female 40-55 years old, common appearance.
            Rate: 5000 rub/shift.
            
            Filming in Moscow, July 2025.
            
            Casting Director: Elena Ivanova
            Director: Mikhail Petrov
            Producer: Vladimir Sidorov
            Company: Chekhov Film Adaptations
            ''',
            'project_data': {
                'title': 'The Chameleon',
                'project_type': 'Short Film',
                'genre': 'Comedy',
                'description': 'Film adaptation of A.P. Chekhov\'s classic story about a police inspector',
                'premiere_date': '2025-09-01',
            },
            'roles': [
                {
                    'character_name': 'Police Inspector Ochumelov',
                    'role_type': 'Actor',
                    'description': 'Lead role. Police inspector walks through market square and sees a crowd. Investigates dog bite incident. Constantly changes his opinion about whether the dog is guilty depending on whose it is. First threatens to punish dog owner, then learns it\'s the general\'s dog and immediately changes position. Key scenes: interrogating Khryukin, talking with crowd, moments when removing and putting on overcoat due to nervousness.',
                    'age_min': 45,
                    'age_max': 55,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '175-180 cm',
                    'body_type': 'Full',
                    'hair_color': 'Dark with gray',
                    'clothing_size': '52-54',
                    'shoe_size': '42-43',
                    'nationality': 'Russian',
                    'rate_per_shift': '25000 rub',
                    'shooting_dates': 'July 2025',
                    'shooting_location': 'Moscow',
                    'skills_required': ['Acting', 'Comedy'],
                    'special_conditions': 'Experience in comedy roles required',
                    'reference_text': 'Official from late 19th century, servile and changing opinions',
                    'audition_requirements': 'Prepare Ochumelov monologue with mood changes',
                    'audition_text': 'Scene when Ochumelov learns the dog belongs to general and changes his decision',
                    'notes': 'Key comedy role, requires excellent timing',
                },
                {
                    'character_name': 'Policeman Yeldyrin',
                    'role_type': 'Actor',
                    'description': 'Ochumelov\'s assistant. Silently follows inspector through entire scene, carries confiscated gooseberries in a sieve. Has no lines but is constantly present, helps Ochumelov remove and put on overcoat.',
                    'age_min': 30,
                    'age_max': 40,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '180-190 cm',
                    'body_type': 'Strong',
                    'hair_color': 'Dark',
                    'clothing_size': '50',
                    'shoe_size': '43-44',
                    'rate_per_shift': '18000 rub',
                    'shooting_dates': 'July 2025',
                    'shooting_location': 'Moscow',
                    'skills_required': ['Acting'],
                    'special_conditions': 'Ability to maintain posture, military bearing',
                    'notes': 'Role without words but important on-screen presence',
                },
                {
                    'character_name': 'Goldsmith Khryukin',
                    'role_type': 'Actor',
                    'description': 'Dog bite victim. Shows bitten finger, complains to Ochumelov, demands justice. Key scene: shows finger and describes how dog bit him. Should evoke both pity and comedy. Ends up with nothing when it turns out dog belongs to general.',
                    'age_min': 35,
                    'age_max': 45,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '165-175 cm',
                    'body_type': 'Average',
                    'hair_color': 'Light brown',
                    'clothing_size': '48',
                    'rate_per_shift': '20000 rub',
                    'shooting_dates': 'July 2025',
                    'shooting_location': 'Moscow',
                    'skills_required': ['Acting'],
                    'audition_requirements': 'Show comedic complaint scene about bite',
                    'audition_text': 'Khryukin\'s monologue about how dog bit him',
                    'notes': 'Important - comedic delivery in dramatic situation',
                },
                {
                    'character_name': 'General Zhigalov',
                    'role_type': 'Actor',
                    'description': 'General, dog owner. Episodic role. Appears in final scene when it turns out dog belongs to him. His brother is mentioned in dialogue as owner of borzoi dog. General must give impression of high-ranking retired military officer before whom everyone trembles.',
                    'age_min': 55,
                    'age_max': 65,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '175-185 cm',
                    'body_type': 'Full',
                    'hair_color': 'Gray',
                    'clothing_size': '54',
                    'rate_per_shift': '15000 rub',
                    'shooting_dates': 'July 2025',
                    'shooting_location': 'Moscow',
                    'skills_required': ['Acting'],
                    'special_conditions': 'Military bearing, impressive appearance',
                    'audition_requirements': 'Show authority and power with just appearance',
                    'reference_text': 'Image of Russian general from late 19th century upper class',
                },
                {
                    'character_name': 'Passerby from crowd',
                    'role_type': 'Extras',
                    'description': 'One of onlookers observing the incident',
                    'age_min': 25,
                    'age_max': 60,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'rate_per_shift': '5000 rub',
                    'shooting_dates': 'July 2025',
                    'shooting_location': 'Moscow',
                    'skills_required': ['Acting'],
                },
                {
                    'character_name': 'Cook',
                    'role_type': 'Extras',
                    'description': 'Woman from crowd of onlookers',
                    'age_min': 40,
                    'age_max': 55,
                    'gender': 'female',
                    'media_presence': 'doesnt_matter',
                    'height': '160-170 cm',
                    'body_type': 'Full',
                    'clothing_size': '48',
                    'rate_per_shift': '5000 rub',
                    'shooting_dates': 'July 2025',
                    'shooting_location': 'Moscow',
                    'skills_required': ['Acting'],
                },
            ],
            'contacts': {
                'casting_director': {'name': 'Elena Ivanova'},
                'director': {'name': 'Mikhail Petrov'},
                'producers': [{'name': 'Vladimir Sidorov'}],
                'production_company': {'name': 'Chekhov Film Adaptations'},
            }
        }
    
    @staticmethod
    def get_all_test_projects() -> List[Dict[str, Any]]:
        """Returns all test projects"""
        return [
            ChekhovTestDataFactoryEN.get_chameleon_project(),
        ]

